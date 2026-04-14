import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class SubscriptionLifecycleMailer extends BaseMail {
  private readonly frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:4200'

  constructor(
    protected payload: {
      email: string
      companyName: string
      subject: string
      headline: string
      message: string
      actionLabel?: string
      actionPath?: string
    }
  ) {
    super()
  }

  prepare() {
    const actionUrl = this.payload.actionPath ? `${this.frontendUrl}${this.payload.actionPath}` : this.frontendUrl

    this.message
      .to(this.payload.email)
      .subject(this.payload.subject)
      .html(`
        <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;color:#0f172a">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
            <p style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6366f1;font-weight:700;margin:0 0 12px">HRNexus Billing</p>
            <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px">${this.payload.headline}</h1>
            <p style="font-size:15px;line-height:1.8;color:#475569;margin:0 0 24px">${this.payload.message}</p>
            <p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 24px">Organization: <strong>${this.payload.companyName}</strong></p>
            <a href="${actionUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">${this.payload.actionLabel || 'Open billing'}</a>
          </div>
        </div>
      `)
  }
}
