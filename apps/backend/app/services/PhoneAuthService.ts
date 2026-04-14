import { DateTime } from 'luxon'
import Employee from '#models/employee'
import OtpToken from '#models/otp_token'
import UserSession from '#models/user_session'
import { inject } from '@adonisjs/core'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'

/**
 * Phone Auth Service - Handles phone OTP authentication
 */
@inject()
export default class PhoneAuthService {
    private readonly OTP_EXPIRY_MINUTES = 10
    private readonly MAX_ATTEMPTS = 3

    private normalizeE164(phone: string): string {
        const digits = phone.replace(/\D/g, '')
        if (!digits) return phone.trim()
        return `+${digits}`
    }

    /**
     * Generate a random OTP
     */
    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString()
    }

    /**
     * Send OTP via SMS (using Twilio or other provider)
     */
    private async sendSMS(to: string, message: string): Promise<boolean> {
        const provider = env.get('SMS_PROVIDER', 'twilio')
        
        if (provider === 'twilio') {
            return this.sendTwilioSMS(to, message)
        }
        
        // For development/testing, just log the OTP
        console.log(`[DEV MODE] OTP for ${to}: ${message}`)
        return true
    }

    /**
     * Send SMS via Twilio
     */
    private async sendTwilioSMS(to: string, message: string): Promise<boolean> {
        try {
            const accountSid = env.get('TWILIO_ACCOUNT_SID')
            const authToken = env.get('TWILIO_AUTH_TOKEN')
            const fromNumberRaw = env.get('TWILIO_PHONE_NUMBER')
            const messagingServiceSid = env.get('TWILIO_MESSAGING_SERVICE_SID')

            if (!accountSid || !authToken || (!fromNumberRaw && !messagingServiceSid)) {
                console.log('[TWILIO] Credentials not configured, logging OTP instead')
                console.log(`[DEV OTP] Phone: ${to}, Code: ${message}`)
                return true
            }

            // AdonisJS backend runs as ESM; use dynamic import instead of require()
            const { default: twilio } = await import('twilio')
            const client = twilio(accountSid, authToken)

            const toNumber = this.normalizeE164(to)
            const fromNumber = fromNumberRaw ? this.normalizeE164(fromNumberRaw) : undefined

            await client.messages.create(
                messagingServiceSid
                    ? {
                          body: message,
                          messagingServiceSid,
                          to: toNumber,
                      }
                    : {
                          body: message,
                          from: fromNumber!,
                          to: toNumber,
                      }
            )

            return true
        } catch (error) {
            console.error('[Twilio SMS Error]:', error)
            return false
        }
    }

    /**
     * Clean and validate phone number
     */
    private cleanPhoneNumber(phone: string): string | null {
        if (!phone) return null

        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '')
        
        if (cleaned.length === 0) return null

        // If it starts with 0 and is 11 digits (e.g. 09876543210), treat as 10 digits
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return '+91' + cleaned.slice(1)
        }

        // Add country code if missing (default to +91 for 10 digits if no other info)
        if (cleaned.length === 10) {
            return '+91' + cleaned
        }
        
        // If it already seems to have a country code (e.g. 91xxxxxxxxxx)
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return '+' + cleaned
        }
        
        return '+' + cleaned
    }

    /**
     * Request OTP for phone login
     */
    async requestOtp(phone: string, orgId?: number): Promise<{ success: boolean; message: string; otpReference?: number }> {
        // Validate phone format
        const cleanPhone = this.cleanPhoneNumber(phone)

        if (!cleanPhone) {
            return { success: false, message: 'Invalid phone number format' }
        }

        // Be flexible when matching DB values (some installations store without +91)
        const digitsOnly = cleanPhone.replace(/\D/g, '')
        const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly

        const variants = Array.from(new Set([
            cleanPhone,
            digitsOnly,
            last10,
            `+${digitsOnly}`,
            `+91${last10}`,
            `91${last10}`,
            `0${last10}`,
            phone // also check raw input directly
        ].filter(Boolean)))

        // Find employee by phone (do not assume a single canonical format)
        const employee = await Employee.query()
            .where((query) => {
                variants.forEach((v) => query.orWhere('phone', v))
            })
            .if(orgId, (query) => query.where('orgId', orgId!)) // Note: uses orgId instead of org_id in Lucid model
            .first()

        if (!employee) {
            // Don't reveal if phone exists
            return {
                success: true,
                message: 'If an account with this phone exists, an OTP has been sent.'
            }
        }

        // Check if phone auth is enabled for this employee
        if (!employee.phoneAuthEnabled) {
            return {
                success: false,
                message: 'Phone authentication is not enabled for this account. Please contact administrator.'
            }
        }

        // Check for existing valid OTP (within last 5 minutes)
        const fiveMinutesAgo = DateTime.now().minus({ minutes: 5 })
        const existingOtp = await OtpToken.query()
            .where('employeeId', employee.id)
            .where('isUsed', false)
            .where('purpose', 'phone_verify')
            .where('createdAt', '>', fiveMinutesAgo.toSQL()!)
            .first()

        if (existingOtp) {
            // Don't send too many OTPs
            return {
                success: true,
                message: 'OTP recently sent. Please wait before requesting another.',
                otpReference: existingOtp.id
            }
        }

        // Generate new OTP
        const otp = this.generateOTP()
        const otpHash = await hash.make(otp)
        const expiresAt = DateTime.now().plus({ minutes: this.OTP_EXPIRY_MINUTES })

        // Store OTP using existing OtpToken model (purpose must match DB enum)
        const phoneOtp = await OtpToken.create({
            employeeId: employee.id,
            orgId: employee.orgId,
            email: employee.email || '',
            otpHash,
            purpose: 'phone_verify',
            channel: 'sms',
            attempts: 0,
            maxAttempts: this.MAX_ATTEMPTS,
            isUsed: false,
            expiresAt: expiresAt,
            ipAddress: null,
        })

        // Construct full E.164 phone number using employee's dialCode if available
        let finalPhoneToSend = cleanPhone || phone;
        if (employee.dialCode && employee.phone) {
            const rawPhoneDigits = employee.phone.replace(/\D/g, '');
            finalPhoneToSend = `+${employee.dialCode}${rawPhoneDigits}`;
        }

        // Send OTP via SMS
        const messageText = `Your HRMS verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
        
        if (env.get('NODE_ENV') === 'development') {
            console.log(`[DEV OTP] Generated OTP for ${finalPhoneToSend}: ${otp}`)
        }
        
        const smsSent = await this.sendSMS(finalPhoneToSend, messageText)

        if (!smsSent) {
            // In development/testing, still return success (OTP is logged by sendSMS fallback)
            if (env.get('NODE_ENV') === 'development') {
                return {
                    success: true,
                    message: 'OTP generated (dev mode).',
                    otpReference: phoneOtp.id
                }
            }

            await phoneOtp.delete()
            return { success: false, message: 'Failed to send OTP. Please try again.' }
        }

        return {
            success: true,
            message: 'OTP sent successfully.',
            otpReference: phoneOtp.id
        }
    }

    /**
     * Verify OTP and login
     */
    async verifyOtp(
        otpReference: number,
        code: string,
        ipAddress?: string
    ): Promise<{ success: boolean; message: string; employee?: Employee; accessToken?: string }> {
        // Find OTP record
        const otpRecord = await OtpToken.find(otpReference)

        if (!otpRecord) {
            return { success: false, message: 'Invalid OTP reference' }
        }

        // Check if already used
        if (otpRecord.isUsed) {
            return { success: false, message: 'OTP already used' }
        }

        // Check if expired
        if (otpRecord.expiresAt < DateTime.now()) {
            return { success: false, message: 'OTP expired' }
        }

        // Check max attempts
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            return { success: false, message: 'Too many attempts. Please request a new OTP.' }
        }

        // Verify OTP
        const isValid = await hash.verify(otpRecord.otpHash, code)
        if (!isValid) {
            otpRecord.attempts += 1
            await otpRecord.save()

            const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts
            return { 
                success: false, 
                message: remainingAttempts > 0 
                    ? `Invalid OTP. ${remainingAttempts} attempts remaining.` 
                    : 'Too many attempts. Please request a new OTP.' 
            }
        }

        // Mark OTP as used
        otpRecord.isUsed = true
        otpRecord.usedAt = DateTime.now()
        await otpRecord.save()

        // Find employee
        const employee = await Employee.find(otpRecord.employeeId)

        if (!employee) {
            return { success: false, message: 'Employee not found' }
        }

        // Check if phone auth is enabled
        if (!employee.phoneAuthEnabled) {
            return { success: false, message: 'Phone authentication is not enabled' }
        }

        // Generate access token - use same method as AuthService
        const token = await Employee.accessTokens.create(employee)
        const accessToken = token.value?.release()

        // Create User Session
        await UserSession.create({
            employeeId: employee.id,
            orgId: employee.orgId,
            sessionToken: token.identifier.toString(),
            ipAddress: ipAddress || null,
            userAgent: null,
            expiresAt: token.expiresAt ? DateTime.fromJSDate(new Date(token.expiresAt)) : DateTime.now().plus({ days: 30 }),
            lastActivity: DateTime.now()
        })

        return {
            success: true,
            message: 'Login successful',
            employee,
            accessToken
        }
    }

    /**
     * Resend OTP
     */
    async resendOtp(otpReference: number): Promise<{ success: boolean; message: string }> {
        const otpRecord = await OtpToken.find(otpReference)

        if (!otpRecord) {
            return { success: false, message: 'Invalid OTP reference' }
        }

        if (otpRecord.isUsed) {
            return { success: false, message: 'OTP already used' }
        }

        if (otpRecord.expiresAt < DateTime.now()) {
            return { success: false, message: 'OTP expired. Please request a new one.' }
        }

        // Find employee to get phone
        const employee = await Employee.find(otpRecord.employeeId)
        if (!employee || !employee.phone) {
            return { success: false, message: 'Employee phone not found' }
        }

        // Generate new OTP
        const otp = this.generateOTP()
        otpRecord.otpHash = await hash.make(otp)
        otpRecord.attempts = 0
        const newExpiresAt = DateTime.now().plus({ minutes: this.OTP_EXPIRY_MINUTES })
        otpRecord.expiresAt = newExpiresAt
        await otpRecord.save()

        // Construct full E.164 phone number using employee's dialCode if available
        let finalPhoneToSend = employee.phone;
        if (employee.dialCode) {
            const rawPhoneDigits = employee.phone.replace(/\D/g, '');
            finalPhoneToSend = `+${employee.dialCode}${rawPhoneDigits}`;
        }

        // Send OTP
        const messageText = `Your HRMS verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`
        
        if (env.get('NODE_ENV') === 'development') {
            console.log(`[DEV OTP] Resend OTP for ${finalPhoneToSend}: ${otp}`)
        }
        
        const smsSent = await this.sendSMS(finalPhoneToSend, messageText)

        if (!smsSent) {
            return { success: false, message: 'Failed to send OTP' }
        }

        return { success: true, message: 'OTP resent successfully' }
    }
}
