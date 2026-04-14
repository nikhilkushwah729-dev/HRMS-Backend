import { DateTime } from 'luxon'
import Employee from '#models/employee'
import SocialLogin from '#models/social_login'
import { inject } from '@adonisjs/core'
import env from '#start/env'
import { randomBytes } from 'node:crypto'

interface GoogleTokenResponse {
    access_token: string
    id_token: string
    expires_in: number
    token_type: string
    scope: string
    refresh_token?: string
}

interface MicrosoftTokenResponse {
    access_token: string
    id_token: string
    expires_in: number
    token_type: string
    scope: string
    refresh_token?: string
}

interface GoogleUserInfo {
    id: string
    email: string
    name: string
    picture?: string
    given_name?: string
    family_name?: string
}

interface MicrosoftUserInfo {
    id: string
    email: string
    displayName: string
    mail?: string
    userPrincipalName: string
    givenName?: string
    surname?: string
}

/**
 * OAuth Service - Handles Google and Microsoft OAuth authentication
 */
@inject()
export default class OAuthService {
    /**
     * Generate state token for OAuth security
     */
    generateState(): string {
        return randomBytes(32).toString('hex')
    }

    /**
     * Get Google OAuth authorization URL (with auto-generated state)
     */
    getGoogleAuthUrl(): string {
        const state = this.generateState()
        const clientId = env.get('GOOGLE_CLIENT_ID') || ''
        const redirectUri = env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:3333/api/auth/google/callback'
        
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'openid'
        ].join(' ')

        return `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${state}` +
            `&access_type=offline` +
            `&prompt=consent`
    }

    /**
     * Get Microsoft OAuth authorization URL (with auto-generated state)
     */
    getMicrosoftAuthUrl(): string {
        const state = this.generateState()
        const clientId = env.get('MICROSOFT_CLIENT_ID') || ''
        const tenantId = env.get('MICROSOFT_TENANT_ID') || 'common'
        const redirectUri = env.get('MICROSOFT_REDIRECT_URI') || 'http://localhost:3333/api/auth/microsoft/callback'
        
        const scopes = [
            'User.Read',
            'email',
            'openid',
            'profile'
        ].join(' ')

        return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
            `client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${state}`
    }

    /**
     * Exchange Google authorization code for tokens
     */
    async exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
        const clientId = env.get('GOOGLE_CLIENT_ID') || ''
        const clientSecret = env.get('GOOGLE_CLIENT_SECRET') || ''
        const redirectUri = env.get('GOOGLE_REDIRECT_URI') || 'http://localhost:3333/api/auth/google/callback'

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            } as Record<string, string>),
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Google token exchange failed: ${error}`)
        }

        return await response.json() as GoogleTokenResponse
    }

    /**
     * Exchange Microsoft authorization code for tokens
     */
    async exchangeMicrosoftCode(code: string): Promise<MicrosoftTokenResponse> {
        const clientId = env.get('MICROSOFT_CLIENT_ID') || ''
        const clientSecret = env.get('MICROSOFT_CLIENT_SECRET') || ''
        const tenantId = env.get('MICROSOFT_TENANT_ID') || 'common'
        const redirectUri = env.get('MICROSOFT_REDIRECT_URI') || 'http://localhost:3333/api/auth/microsoft/callback'

        const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                scope: 'User.Read email openid profile',
            } as Record<string, string>),
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Microsoft token exchange failed: ${error}`)
        }

        return await response.json() as MicrosoftTokenResponse
    }

    /**
     * Get user info from Google
     */
    async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
            throw new Error('Failed to get Google user info')
        }

        return await response.json() as GoogleUserInfo
    }

    /**
     * Get user info from Microsoft
     */
    async getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
            throw new Error('Failed to get Microsoft user info')
        }

        return await response.json() as MicrosoftUserInfo
    }

    /**
     * Find or create user from OAuth provider
     */
    async findOrCreateFromOAuth(
        provider: 'google' | 'microsoft',
        providerUserId: string,
        email: string,
        name: string,
        orgId?: number
    ): Promise<Employee> {
        // Check if social login exists
        const socialLogin = await SocialLogin.query()
            .where('provider', provider)
            .where('provider_user_id', providerUserId)
            .first()

        if (socialLogin) {
            const employee = await Employee.find(socialLogin.employeeId)
            if (employee) {
                // Update last login
                socialLogin.lastLoginAt = DateTime.now()
                await socialLogin.save()
                return employee
            }
        }

        // Check if employee exists with this email
        let employee = await Employee.query()
            .where('email', email.toLowerCase())
            .first()

        if (!employee && orgId) {
            // Create new employee if org is provided
            employee = await Employee.create({
                orgId,
                email: email.toLowerCase(),
                firstName: name.split(' ')[0],
                lastName: name.split(' ').slice(1).join(' ') || null,
                loginType: provider,
                emailVerified: true,
                status: 'active',
            } as any)
        }

        if (!employee) {
            throw new Error('No account found with this email. Please contact administrator.')
        }

        // Create social login link
        await SocialLogin.create({
            employeeId: employee.id,
            provider,
            providerUserId,
            isPrimary: true,
            lastLoginAt: DateTime.now(),
        })

        // Update login type
        employee.loginType = provider
        await employee.save()

        return employee
    }

    /**
     * Validate OAuth state token
     */
    validateState(storedState: string, providedState: string): boolean {
        if (!storedState || !providedState) return false
        if (storedState !== providedState) return false
        return true
    }

    /**
     * Link social account to existing user
     */
    async linkSocialAccount(
        employee: Employee,
        provider: 'google' | 'microsoft',
        providerUserId: string,
        email?: string | null
    ): Promise<void> {
        // Check if already linked
        const existingLink = await SocialLogin.query()
            .where('employee_id', employee.id)
            .where('provider', provider)
            .first()

        if (existingLink) {
            // Update existing link
            existingLink.providerUserId = providerUserId
            existingLink.lastLoginAt = DateTime.now()
            if (email) existingLink.phone = email
            await existingLink.save()
        } else {
            // Create new link
            await SocialLogin.create({
                employeeId: employee.id,
                provider,
                providerUserId,
                phone: email || null,
                isPrimary: false,
                lastLoginAt: DateTime.now(),
            })
        }

        // Update employee login type if not already set
        if (!employee.loginType || employee.loginType === 'email') {
            employee.loginType = provider
            await employee.save()
        }
    }
}
