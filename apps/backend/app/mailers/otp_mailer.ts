import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class OtpMailer extends BaseMail {
    constructor(protected user: { email: string; firstName: string }, protected code: string) {
        super()
    }

    prepare() {
        this.message
            .from(env.get('SMTP_USERNAME', 'no-reply@hrms.local'))
            .to(this.user.email)
            .subject('Your Verification Code')
            .htmlView('emails/otp', {
                user: this.user,
                code: this.code
            })
    }
}
