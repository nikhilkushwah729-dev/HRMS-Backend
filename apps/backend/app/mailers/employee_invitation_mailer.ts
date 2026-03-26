import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

interface InvitationMailPayload {
    email: string
    organizationName: string
    roleName: string
    inviterName: string
    invitationUrl: string
    expiresAt: string
}

export default class EmployeeInvitationMailer extends BaseMail {
    constructor(protected payload: InvitationMailPayload) {
        super()
    }

    prepare() {
        this.message
            .from(env.get('SMTP_USERNAME', 'no-reply@hrms.local'))
            .to(this.payload.email)
            .subject(`Invitation to join ${this.payload.organizationName}`)
            .htmlView('emails/employee_invitation', {
                invitation: this.payload,
            })
    }
}
