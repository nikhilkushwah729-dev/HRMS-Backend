import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class PasswordResetMailer extends BaseMail {
    private readonly frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:4200'

    constructor(protected user: { email: string; fullName: string }, protected token: string) {
        super()
    }

    prepare() {
        this.message
            .to(this.user.email)
            .subject('Reset your password')
            .htmlView('emails/password_reset', {
                user: this.user,
                url: `${this.frontendUrl}/auth/reset-password?token=${this.token}`
            })
    }
}
