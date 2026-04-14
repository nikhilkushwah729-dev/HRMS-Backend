import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import OrgRegistration from '#models/org_registration'
import EmailVerificationToken from '#models/email_verification_token'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Role from '#models/role'
import hash from '@adonisjs/core/services/hash'
import stringHelpers from '@adonisjs/core/helpers/string'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import RegistrationMailer from '#mailers/registration_mailer'
import SubscriptionService from '#services/SubscriptionService'
import { COUNTRIES, CountryCodeData } from '../constants/countries.js'

/**
 * Get the real client IP address from the request.
 * Checks X-Forwarded-For header first (for proxied requests),
 * then X-Real-IP header, and falls back to request.ip()
 */
function getClientIp(request: any): string | null {
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
    return request.ip()
}

export default class OrgRegistrationController {

    static registerValidator = vine.compile(
        vine.object({
            companyName: vine.string().trim().maxLength(255),
            email: vine.string().email().normalizeEmail(),
            phone: vine.string().regex(/^\+?[1-9]\d{6,14}$/).optional(), // Allows international formats
            country: vine.string().maxLength(100).optional(),
            countryCode: vine.string().maxLength(5).optional(),
            countryName: vine.string().maxLength(100).optional(),
            adminFirstName: vine.string().trim().maxLength(100),
            adminLastName: vine.string().trim().maxLength(100).optional(),
            adminPassword: vine.string().minLength(8),
            dialCode: vine.string().maxLength(10).optional(),
            planId: vine.number().optional()
        })
    )

    async register({ request, response }: HttpContext) {
        const data = await request.validateUsing(OrgRegistrationController.registerValidator)
        const payload = request.all()

        try {
            const existingOrgRow = await db.from('organizations').where('email', data.email).first()
            if (existingOrgRow) {
                return response.badRequest({ message: 'Email already registered for an organization' })
            }

            const existingEmpRow = await db.from('employees').where('email', data.email).first()
            if (existingEmpRow) {
                return response.badRequest({ message: 'Email already registered' })
            }

            const countryCodeData = COUNTRIES.find(
                (c: CountryCodeData) =>
                    c.flag.toLowerCase() === payload.countryCode?.toLowerCase() || c.code === payload.dialCode
            )

            if (countryCodeData && payload.phone) {
                if (payload.phone.length !== countryCodeData.phoneNumberLength) {
                    return response.badRequest({
                        errors: [{
                            message: `Phone number for ${countryCodeData.name} must be exactly ${countryCodeData.phoneNumberLength} digits.`,
                            field: 'phone'
                        }]
                    })
                }
            }

            const passwordHash = await hash.make(payload.adminPassword)

            const baseSlug = stringHelpers.dashCase(payload.companyName).toLowerCase()
            const randomSuffix = stringHelpers.generateRandom(4)
            const orgSlug = `${baseSlug}-${randomSuffix}`

            const organization = await Organization.create({
                companyName: payload.companyName,
                slug: orgSlug,
                email: payload.email,
                phone: payload.phone || null,
                country: payload.country || payload.countryName || null,
                planId: payload.planId || null,
                planStatus: true,
                isActive: true,
                isVerified: true,
                timezone: 'Asia/Kolkata',
            })

            let creatorRole = await Role.query()
                .where('role_name', 'Super Admin')
                .where((query) => {
                    query.where('org_id', organization.id).orWhereNull('org_id')
                })
                .orderByRaw('CASE WHEN org_id IS NULL THEN 1 ELSE 0 END')
                .first()

            if (!creatorRole) {
                creatorRole = await Role.query()
                    .where('role_name', 'Admin')
                    .where((query) => {
                        query.where('org_id', organization.id).orWhereNull('org_id')
                    })
                    .orderByRaw('CASE WHEN org_id IS NULL THEN 1 ELSE 0 END')
                    .first()
            }

            if (!creatorRole) {
                creatorRole = await Role.create({
                    orgId: organization.id,
                    roleName: 'Super Admin',
                    isSystem: true,
                })
            }

            const employee = await Employee.create({
                orgId: organization.id,
                firstName: payload.adminFirstName,
                lastName: payload.adminLastName || null,
                email: payload.email,
                passwordHash,
                roleId: creatorRole.id,
                status: 'active',
                emailVerified: true,
                phone: payload.phone || null,
                phoneVerified: true,
                phoneAuthEnabled: true,
                loginType: payload.phone ? 'phone' : 'email',
                countryCode: payload.countryCode || null,
                countryName: payload.countryName || payload.country || null,
                mustChangePassword: false,
                isLocked: false,
            })

            try {
                const rawToken = stringHelpers.generateRandom(32)
                await OrgRegistration.create({
                    companyName: payload.companyName,
                    email: payload.email,
                    phone: payload.phone || null,
                    country: payload.country || payload.countryName || null,
                    adminFirstName: payload.adminFirstName,
                    adminLastName: payload.adminLastName || null,
                    adminPasswordHash: passwordHash,
                    planId: payload.planId || null,
                    stepCompleted: 1,
                    status: 'active',
                    orgId: organization.id,
                    ipAddress: getClientIp(request),
                    userAgent: request.header('user-agent'),
                    expiresAt: DateTime.now().plus({ hours: 48 })
                })

                mail.send(new RegistrationMailer({
                    email: payload.email,
                    companyName: payload.companyName,
                    adminFirstName: payload.adminFirstName
                }, rawToken)).catch((error: any) => {
                    console.error('--- REGISTRATION MAIL FAILURE ---')
                    console.error(error)
                })
            } catch (registrationMetaError) {
                console.warn('[org registration metadata skipped]', registrationMetaError)
            }

            await db.table('leave_types').multiInsert([
                {
                    org_id: organization.id,
                    type_name: 'Casual Leave',
                    days_allowed: 12,
                    carry_forward: false,
                    max_carry_days: 0,
                    is_paid: true,
                    requires_doc: false,
                },
                {
                    org_id: organization.id,
                    type_name: 'Sick Leave',
                    days_allowed: 8,
                    carry_forward: false,
                    max_carry_days: 0,
                    is_paid: true,
                    requires_doc: true,
                },
                {
                    org_id: organization.id,
                    type_name: 'Earned Leave',
                    days_allowed: 15,
                    carry_forward: true,
                    max_carry_days: 30,
                    is_paid: true,
                    requires_doc: false,
                },
            ])

            await new SubscriptionService().assignTrialToOrganization(organization.id)

            return response.created({
                message: 'Registration completed successfully.',
                orgId: organization.id,
                employeeId: employee.id,
            })
        } catch (error) {
            console.error('[register error]', error)
            return response.internalServerError({
                message: 'Registration failed on the server. Please try again.',
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    async verifyEmail({ request, response }: HttpContext) {
        const token = request.input('token')
        if (!token) {
            return response.badRequest({ message: 'Token is required' })
        }

        const crypto = await import('node:crypto')
        const sha256Hash = crypto.createHash('sha256').update(token).digest('hex')

        const verificationToken = await EmailVerificationToken.query()
            .where('token_hash', sha256Hash)
            .where('is_used', false)
            .where('expires_at', '>', DateTime.now().toSQL()!)
            .first()

        if (!verificationToken) {
            return response.badRequest({ message: 'Invalid or expired verification token' })
        }

        // Mark token as used
        verificationToken.isUsed = true
        verificationToken.usedAt = DateTime.now()
        await verificationToken.save()

        // Find associated records and update
        if (verificationToken.purpose === 'org_registration') {
            const orgReg = await OrgRegistration.query()
                .where('email', verificationToken.email)
                .first()

            if (orgReg) {
                orgReg.status = 'active'
                await orgReg.save()

                // Also update the Organization if it exists
                const organization = await Organization.findBy('email', verificationToken.email)
                if (organization) {
                    organization.isVerified = true
                    await organization.save()
                }

                // Also update the Employee if it exists
                const employee = await Employee.findBy('email', verificationToken.email)
                if (employee) {
                    employee.emailVerified = true
                    await employee.save()
                }
            }
        }

        return response.ok({ message: 'Email verified successfully. You can now log in.' })
    }
}
