import { BaseMail } from '@adonisjs/mail'

export default class RegistrationMailer extends BaseMail {
    constructor(protected user: { email: string; companyName: string; adminFirstName: string }, protected token: string) {
        super()
    }

    prepare() {
        this.message
            .to(this.user.email)
            .subject(`Welcome to ${this.user.companyName}!`)
            .htmlView('emails/registration', {
                user: this.user,
                url: `http://localhost:3333/api/auth/verify-email?token=${this.token}` // Corrected URL
            })
    }
}
