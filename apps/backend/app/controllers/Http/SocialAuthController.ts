import type { HttpContext } from '@adonisjs/core/http'
import OAuthService from '#services/OAuthService'
import AuthorizationService from '#services/AuthorizationService'
import Employee from '#models/employee'

/**
 * Social Authentication Controller
 * Handles OAuth (Google, Microsoft) and Phone OTP authentication
 */
export default class SocialAuthController {
  private oauthService: OAuthService
  private authorizationService: AuthorizationService
  private readonly firebaseApiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCykZJKsYtyQ8xY8uGsTBa-42LY2Fdf-k8'

  // Frontend URL for OAuth redirect
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200'

  constructor() {
    this.oauthService = new OAuthService()
    this.authorizationService = new AuthorizationService()
  }

  private buildFrontendErrorRedirect(message: string): string {
    return `${this.frontendUrl}/auth/callback?success=false&message=${encodeURIComponent(message)}`
  }

  private buildFrontendSuccessPayload(employee: Employee) {
    return encodeURIComponent(
      JSON.stringify({
        id: employee.id,
        orgId: employee.orgId,
        roleId: employee.roleId,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        avatar: employee.avatar,
        loginType: employee.loginType,
        status: employee.status,
      })
    )
  }

  /**
   * Generate access token for employee
   */
  private async generateAccessToken(employee: Employee): Promise<string> {
    const token = await Employee.accessTokens.create(employee)
    return token.value?.release() || ''
  }

  /**
   * GET /auth/google - Redirect to Google OAuth
   */
  async redirectToGoogle({ response }: HttpContext) {
    const authUrl = this.oauthService.getGoogleAuthUrl()
    return response.redirect(authUrl)
  }

  /**
   * GET /auth/google/callback - Handle Google OAuth callback
   */
  async handleGoogleCallback({ request, response }: HttpContext) {
    const code = request.qs().code
    const error = request.qs().error

    if (error) {
      return response.redirect(this.buildFrontendErrorRedirect('Google authentication was cancelled or denied'))
    }

    if (!code) {
      return response.redirect(this.buildFrontendErrorRedirect('No authorization code received from Google'))
    }

    try {
      const tokens = await this.oauthService.exchangeGoogleCode(code)
      const googleUser = await this.oauthService.getGoogleUserInfo(tokens.access_token)
      
      const employee = await this.oauthService.findOrCreateFromOAuth(
        'google',
        googleUser.id,
        googleUser.email,
        `${googleUser.given_name || googleUser.name?.split(' ')[0] || 'User'} ${googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || ''}`.trim()
      )
      await this.authorizationService.normalizeLegacyOrganizationRole(employee)

      const isNew = !(employee.loginType === 'google' || employee.loginType === 'microsoft')
      const accessToken = await this.generateAccessToken(employee)
      const employeeData = this.buildFrontendSuccessPayload(employee)
      const message = encodeURIComponent(isNew ? 'Account created via Google' : 'Logged in with Google')
      
      return response.redirect(
        `${this.frontendUrl}/auth/callback?success=true&token=${accessToken}&employee=${employeeData}&isNewAccount=${isNew}&message=${message}`
      )
    } catch (error) {
      console.error('Google OAuth error:', error)
      const reason = error instanceof Error ? error.message : 'Failed to complete Google authentication'
      return response.redirect(this.buildFrontendErrorRedirect(reason))
    }
  }

  /**
   * GET /auth/microsoft - Redirect to Microsoft OAuth
   */
  async redirectToMicrosoft({ response }: HttpContext) {
    const authUrl = this.oauthService.getMicrosoftAuthUrl()
    return response.redirect(authUrl)
  }

  /**
   * GET /auth/microsoft/callback - Handle Microsoft OAuth callback
   */
  async handleMicrosoftCallback({ request, response }: HttpContext) {
    const code = request.qs().code
    const error = request.qs().error

    if (error) {
      return response.redirect(this.buildFrontendErrorRedirect('Microsoft authentication was cancelled or denied'))
    }

    if (!code) {
      return response.redirect(this.buildFrontendErrorRedirect('No authorization code received from Microsoft'))
    }

    try {
      const tokens = await this.oauthService.exchangeMicrosoftCode(code)
      const microsoftUser = await this.oauthService.getMicrosoftUserInfo(tokens.access_token)
      
      const name = `${microsoftUser.givenName || microsoftUser.displayName?.split(' ')[0] || 'User'} ${microsoftUser.surname || microsoftUser.displayName?.split(' ').slice(1).join(' ') || ''}`.trim()
      const employee = await this.oauthService.findOrCreateFromOAuth(
        'microsoft',
        microsoftUser.id,
        microsoftUser.mail || microsoftUser.userPrincipalName,
        name
      )
      await this.authorizationService.normalizeLegacyOrganizationRole(employee)

      const isNew = !(employee.loginType === 'google' || employee.loginType === 'microsoft')
      const accessToken = await this.generateAccessToken(employee)
      const employeeData = this.buildFrontendSuccessPayload(employee)
      const message = encodeURIComponent(isNew ? 'Account created via Microsoft' : 'Logged in with Microsoft')
      
      return response.redirect(
        `${this.frontendUrl}/auth/callback?success=true&token=${accessToken}&employee=${employeeData}&isNewAccount=${isNew}&message=${message}`
      )
    } catch (error) {
      console.error('Microsoft OAuth error:', error)
      const reason = error instanceof Error ? error.message : 'Failed to complete Microsoft authentication'
      return response.redirect(this.buildFrontendErrorRedirect(reason))
    }
  }

  /**
   * POST /auth/phone/request-otp - Request OTP for phone login (kept for backwards compat; Firebase does not use this)
   */
  async requestPhoneOtp({ request, response }: HttpContext) {
    const { phone } = request.only(['phone'])
    if (!phone) {
      return response.badRequest({ success: false, message: 'Phone number is required' })
    }
    // Firebase sends OTPs on the client side; backend just acknowledges
    return response.ok({ success: true, message: 'OTP is handled by Firebase on the client side.' })
  }

  /**
   * POST /auth/phone/verify - Verify Firebase ID token and login
   */
  async verifyPhoneOtp({ request, response }: HttpContext) {
    const { phone, otp, firebaseToken } = request.only(['phone', 'otp', 'firebaseToken'])

    // firebaseToken is the Firebase ID token from the frontend
    // For backwards compatibility, also accept it in the 'otp' field
    const idToken = firebaseToken || otp

    if (!idToken) {
      return response.badRequest({
        success: false,
        message: 'Firebase ID token is required'
      })
    }

    if (!this.firebaseApiKey) {
      return response.internalServerError({
        success: false,
        message: 'Firebase is not configured on the backend'
      })
    }

    try {
      // Verify Firebase ID token via Google Identity Toolkit REST API (no firebase-admin SDK needed)
      const verifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${this.firebaseApiKey}`
      const timeoutSignal = AbortSignal.timeout(10000)

      const verifyRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        signal: timeoutSignal,
      })

      const verifyData: any = await verifyRes.json().catch(() => ({}))

      if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
        console.error('[Firebase verify error]', verifyData)
        const firebaseError = verifyData?.error?.message || ''
        let message = 'Invalid or expired Firebase token'

        if (firebaseError === 'INVALID_ID_TOKEN') {
          message = 'Invalid Firebase token. Please request OTP again.'
        } else if (firebaseError === 'USER_DISABLED') {
          message = 'This Firebase phone user is disabled.'
        } else if (firebaseError === 'PROJECT_NOT_FOUND') {
          message = 'Firebase project configuration is invalid on the backend.'
        } else if (firebaseError === 'CREDENTIAL_MISMATCH') {
          message = 'Frontend and backend Firebase projects do not match.'
        } else if (firebaseError) {
          message = `Firebase verification failed: ${firebaseError}`
        }

        return response.status(401).json({ success: false, message })
      }

      const firebaseUser = verifyData.users[0]
      const firebasePhone: string = firebaseUser.phoneNumber || ''

      if (!firebasePhone) {
        return response.status(401).json({ success: false, message: 'No phone number in Firebase token' })
      }

      // Match phone number in database (multiple format variants)
      const digitsOnly = firebasePhone.replace(/\D/g, '')
      const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly
      const variants = Array.from(new Set([
        firebasePhone,
        digitsOnly,
        last10,
        `+${digitsOnly}`,
        `+91${last10}`,
        `91${last10}`,
        phone || ''
      ].filter(Boolean)))

      const employee = await Employee.query()
        .where((query) => {
          variants.forEach((v) => query.orWhere('phone', v))
        })
        .first()

      if (!employee) {
        return response.status(404).json({
          success: false,
          message: 'No account found with this phone number. Please contact your administrator.'
        })
      }

      await this.authorizationService.normalizeLegacyOrganizationRole(employee)

      // Generate AdonisJS access token
      const token = await Employee.accessTokens.create(employee)
      const accessToken = token.value?.release()

      return response.ok({
        success: true,
        message: 'Login successful',
        token: accessToken,
        user: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          roleId: employee.roleId,
          orgId: employee.orgId,
        },
      })
    } catch (err) {
      console.error('[verifyPhoneOtp error]', err)
      const error = err as Error & { name?: string }
      const rawMessage = error?.message || ''
      const isDatabaseEngineError =
        rawMessage.includes('Got error 1877') ||
        rawMessage.includes('storage engine InnoDB') ||
        rawMessage.includes('Unknown error')

      const message =
        isDatabaseEngineError
          ? 'Employee database table is unavailable right now. Please contact your administrator.'
          : error?.name === 'TimeoutError'
          ? 'Firebase verification timed out. Please try again.'
          : error?.message
            ? `Firebase verification failed: ${error.message}`
            : 'Firebase verification failed'

      return response.status(502).json({ success: false, message })
    }
  }

  /**
   * POST /auth/phone/resend - Resend OTP (with Firebase, the client re-triggers; this is kept for backwards compat)
   */
  async resendPhoneOtp({ response }: HttpContext) {
    return response.ok({ success: true, message: 'With Firebase auth, please retry OTP from the app.' })
  }

  /**
   * POST /auth/phone/enable - Enable phone auth for user
   */
  async enablePhoneAuth({ request, response, auth }: HttpContext) {
    const { phone } = request.only(['phone'])
    const user = auth.user

    if (!user) {
      return response.unauthorized({ success: false, message: 'Not authenticated' })
    }

    if (!phone) {
      return response.badRequest({ success: false, message: 'Phone number is required' })
    }

    user.phone = phone
    user.phoneAuthEnabled = true
    user.loginType = 'phone'
    await user.save()

    return response.ok({
      success: true,
      message: 'Phone authentication enabled successfully',
    })
  }

  /**
   * POST /auth/phone/disable - Disable phone auth for user
   */
  async disablePhoneAuth({ response, auth }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ success: false, message: 'Not authenticated' })
    }

    user.phoneAuthEnabled = false
    await user.save()

    return response.ok({
      success: true,
      message: 'Phone authentication disabled successfully',
    })
  }

  /**
   * POST /auth/social/link - Link social account to existing user
   */
  async linkSocialAccount({ request, response, auth }: HttpContext) {
    const { provider, code } = request.only(['provider', 'code'])
    const user = auth.user

    if (!user) {
      return response.unauthorized({ success: false, message: 'Not authenticated' })
    }

    if (!provider || !code) {
      return response.badRequest({ 
        success: false, 
        message: 'Provider and authorization code are required' 
      })
    }

    try {
      let tokens: any, providerUser: any
      
      if (provider === 'google') {
        tokens = await this.oauthService.exchangeGoogleCode(code)
        providerUser = await this.oauthService.getGoogleUserInfo(tokens.access_token)
      } else if (provider === 'microsoft') {
        tokens = await this.oauthService.exchangeMicrosoftCode(code)
        providerUser = await this.oauthService.getMicrosoftUserInfo(tokens.access_token)
      } else {
        return response.badRequest({ 
          success: false, 
          message: 'Invalid provider. Supported: google, microsoft' 
        })
      }

      await this.oauthService.linkSocialAccount(
        user,
        provider,
        providerUser.id,
        provider === 'google' ? providerUser.email : providerUser.mail || providerUser.userPrincipalName
      )

      return response.ok({
        success: true,
        message: `${provider} account linked successfully`,
      })
    } catch (error) {
      console.error('Link social account error:', error)
      return response.status(500).json({
        success: false,
        message: 'Failed to link social account',
      })
    }
  }
}
