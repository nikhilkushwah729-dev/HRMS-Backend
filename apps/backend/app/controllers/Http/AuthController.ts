import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Employee from '#models/employee'
import PasswordResetToken from '#models/password_reset_token'
import { DateTime } from 'luxon'
import stringHelpers from '@adonisjs/core/helpers/string'
import { createHash } from 'node:crypto'
import PasswordResetMailer from '#mailers/password_reset_mailer'
import mail from '@adonisjs/mail/services/main'
import AuthService from '#services/AuthService'
import AuthorizationService from '#services/AuthorizationService'
import { inject } from '@adonisjs/core'

/**
 * Get the real client IP address from the request.
 * Checks X-Forwarded-For header first (for proxied requests),
 * then X-Real-IP header, and falls back to request.ip()
 */
function getClientIp(request: any): string {
    // Check X-Forwarded-For header (may contain multiple IPs: client, proxy1, proxy2)
    const forwardedFor = request.header('x-forwarded-for')
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map((ip: string) => ip.trim())
        if (ips.length > 0 && ips[0]) {
            return ips[0]
        }
    }

    // Check X-Real-IP header (commonly used by Nginx, proxies)
    const realIp = request.header('x-real-ip')
    if (realIp) {
        return realIp.trim()
    }

    // Fall back to AdonisJS's built-in ip() method
    return request.ip() || ''
}

@inject()
export default class AuthController {
    constructor(
        protected authService: AuthService,
        protected authorizationService: AuthorizationService
    ) { }

    static loginValidator = vine.compile(
        vine.object({
            email: vine.string().email(),
            password: vine.string(),
        })
    )

    static verifyOtpValidator = vine.compile(
        vine.object({
            otpReference: vine.number(),
            code: vine.string().minLength(6).maxLength(6)
        })
    )

    // New endpoints for email-first login flow
    static requestEmailOtpValidator = vine.compile(
        vine.object({
            email: vine.string().email()
        })
    )

    static verifyEmailOtpValidator = vine.compile(
        vine.object({
            otpReference: vine.number(),
            code: vine.string().minLength(6).maxLength(6)
        })
    )

    static loginWithVerifiedEmailValidator = vine.compile(
        vine.object({
            sessionToken: vine.string(),
            password: vine.string()
        })
    )

    static checkIdentifierValidator = vine.compile(
        vine.object({
            identifier: vine.string(),
        })
    )

    private normalizeEmailIdentifier(identifier: string): string {
        return String(identifier || '').trim().toLowerCase()
    }

    private normalizePhoneIdentifier(identifier: string): string {
        const digits = String(identifier || '').replace(/\D/g, '')
        return digits ? `+${digits}` : ''
    }

    /**
     * Check whether an email/phone identifier exists.
     * Note: This endpoint is intended for UX flows and may reveal existence.
     */
    async checkIdentifier({ request, response }: HttpContext) {
        const { identifier } = await request.validateUsing(AuthController.checkIdentifierValidator)
        const raw = String(identifier || '').trim()

        if (!raw) {
            return response.badRequest({ exists: false, type: 'unknown' })
        }

        if (raw.includes('@')) {
            const email = this.normalizeEmailIdentifier(raw)
            const employee = await Employee.query().where('email', email).whereNull('deleted_at').first()
            return response.ok({ exists: Boolean(employee), type: 'email' })
        }

        const phone = this.normalizePhoneIdentifier(raw)
        if (!phone) {
            return response.badRequest({ exists: false, type: 'phone' })
        }

        const digitsOnly = phone.replace(/\D/g, '')
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly
        const variants = Array.from(new Set([
            phone,
            digitsOnly,
            last10,
            `+${digitsOnly}`,
            `+91${last10}`,
            `91${last10}`,
        ].filter(Boolean)))

        const employee = await Employee.query()
            .where((query) => {
                variants.forEach((v) => query.orWhere('phone', v))
            })
            .whereNull('deleted_at')
            .first()

        return response.ok({ exists: Boolean(employee), type: 'phone' })
    }

    /**
     * Request OTP for email verification (Step 1)
     */
    async requestEmailOtp({ request, response }: HttpContext) {
        const { email } = await request.validateUsing(AuthController.requestEmailOtpValidator)
        const ipAddress = getClientIp(request)

        const result = await this.authService.requestEmailOtp(email, ipAddress)
        return response.ok(result)
    }

    /**
     * Verify email OTP and get session token (Step 2)
     */
    async verifyEmailOtp({ request, response }: HttpContext) {
        const { otpReference, code } = await request.validateUsing(AuthController.verifyEmailOtpValidator)
        const ipAddress = getClientIp(request)

        const result = await this.authService.verifyEmailOtp(otpReference, code, ipAddress)
        return response.ok(result)
    }

    /**
     * Complete login with verified email and password (Step 3)
     */
    async loginWithVerifiedEmail({ request, response }: HttpContext) {
        const { sessionToken, password } = await request.validateUsing(AuthController.loginWithVerifiedEmailValidator)
        const ipAddress = getClientIp(request)
        const userAgent = request.header('user-agent') || null

        const result = await this.authService.loginWithVerifiedEmail(sessionToken, password, ipAddress, userAgent)
        return response.ok({
            message: 'Login successful',
            ...result
        })
    }

    async login({ request, response }: HttpContext) {
        const { email, password } = await request.validateUsing(AuthController.loginValidator)
        const ipAddress = getClientIp(request)
        const userAgent = request.header('user-agent') || null

        const result = await this.authService.login(email, password, ipAddress, userAgent)
        return response.ok(result)
    }

    async verifyOtp({ request, response }: HttpContext) {
        const { otpReference, code } = await request.validateUsing(AuthController.verifyOtpValidator)
        const ipAddress = getClientIp(request)
        const userAgent = request.header('user-agent') || null

        const result = await this.authService.verifyOtp(otpReference, code, ipAddress, userAgent)
        return response.ok({
            message: 'Login successful',
            ...result
        })
    }

    async logout({ auth, response }: HttpContext) {
        const user = auth.getUserOrFail()
        if (user.currentAccessToken) {
            await this.authService.logout(user, user.currentAccessToken.identifier.toString())
        }
        return response.ok({ message: 'Logged out successfully' })
    }

    async me({ auth, response }: HttpContext) {
        const user = auth.getUserOrFail()
        let access: {
            roleId: number | null
            roleName: string
            scope: 'all' | 'team' | 'self' | 'finance'
            permissionKeys: string[]
        } = {
            roleId: user.roleId ?? null,
            roleName: 'Employee',
            scope: 'self' as const,
            permissionKeys: [] as string[],
        }

        try {
            access = await this.authorizationService.getAccessProfile(user)
        } catch (error) {
            console.error('Failed to build access profile for /auth/me:', error)
        }

        return response.ok({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            roleId: user.roleId,
            orgId: user.orgId,
            avatar: user.avatar,
            role: { id: access.roleId, name: access.roleName },
            permissions: access.permissionKeys,
            accessScope: access.scope
        })
    }

    async forgotPassword({ request, response }: HttpContext) {
        console.log('--- FORGOT PASSWORD REQUEST RECEIVED ---')
        try {
            const email = request.input('email')
            console.log('Email:', email)
            if (!email) {
                return response.badRequest({ message: 'Email is required' })
            }

            const employee = await Employee.query().where('email', email).first()
            if (!employee) {
                console.log('Employee not found for email:', email)
                // Still return success to prevent email enumeration
                return response.ok({ message: 'If an account with that email exists, we have sent a password reset link.' })
            }

            // Log password reset request
            const ipAddress = getClientIp(request)
            const userAgent = request.header('user-agent') || null
            await this.authService.logPasswordReset(employee, ipAddress, userAgent)

            const rawToken = stringHelpers.generateRandom(32)
            const tokenHash = createHash('sha256').update(rawToken).digest('hex')

            await PasswordResetToken.create({
                employeeId: employee.id,
                token: tokenHash,
                expiresAt: DateTime.now().plus({ hours: 2 })
            })
            console.log('Token created successfully')

            // Send actual email (Async - no await to prevent hanging the response)
            if (employee.email) {
                console.log('Attempting to send mail to:', employee.email)
                mail.send(new PasswordResetMailer({
                    email: employee.email,
                    fullName: employee.fullName
                }, rawToken))
                    .then(() => console.log('--- MAIL SENT SUCCESSFULLY ---'))
                    .catch(error => {
                        console.error('--- ASYNC MAIL FAILURE ---')
                        console.error(error)
                    })
                console.log('Mail task initiated (non-blocking)')
            } else {
                console.log('--- EMPLOYEE HAS NO EMAIL ---')
            }

            return response.ok({
                message: 'If an account with that email exists, we have sent a password reset link.',
                _debug_token: rawToken
            })
        } catch (error) {
            console.error('--- FORGOT PASSWORD FATAL ERROR ---')
            console.error(error)
            return response.internalServerError({ message: 'An internal error occurred', error: error.message })
        }
    }

    async resetPassword({ request, response }: HttpContext) {
        const { token, new_password } = request.only(['token', 'new_password'])
        const password = new_password || ''  // Accept both 'password' and 'new_password'
        const ipAddress = getClientIp(request)
        const userAgent = request.header('user-agent') || null

        if (!token || !password) {
            return response.badRequest({ message: 'Token and password are required' })
        }

        const tokenHash = createHash('sha256').update(token).digest('hex')

        const resetToken = await PasswordResetToken.query()
            .where('token', tokenHash)
            .andWhere('expires_at', '>', DateTime.now().toSQL()!)
            .first()

        if (!resetToken) {
            return response.badRequest({ message: 'Invalid or expired token' })
        }

        const employee = await Employee.find(resetToken.employeeId)
        if (!employee) {
            return response.notFound({ message: 'Employee not found' })
        }

        employee.passwordHash = password // Employee model has beforeSave hook to hash the password
        employee.mustChangePassword = false
        await employee.save()

        // Delete the token
        await resetToken.delete()

        // Log password change
        await this.authService.logPasswordChange(employee, ipAddress, userAgent)

        return response.ok({ message: 'Password has been reset successfully' })
    }
}
