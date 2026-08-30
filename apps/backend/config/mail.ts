import { defineConfig, transports } from '@adonisjs/mail'
import env from '#start/env'

const mailConfig = defineConfig({
    default: 'smtp',
    mailers: {
        smtp: transports.smtp({
            host: env.get('SMTP_HOST', 'localhost'),
            port: env.get('SMTP_PORT', 1025),
            // Render resolves smtp.gmail.com to IPv6 first, but its service
            // network has no IPv6 egress. Force Gmail SMTP over IPv4.
            family: 4,
            secure: env.get('SMTP_SECURE', env.get('SMTP_PORT', 1025) === 465),
            auth: {
                type: 'login',
                user: env.get('SMTP_USERNAME', ''),
                pass: env.get('SMTP_PASSWORD', ''),
            },
        } as any),
    },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
    export interface MailersList extends InferMailers<typeof mailConfig> { }
}
