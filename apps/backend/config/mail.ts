import { defineConfig, transports } from '@adonisjs/mail'
import env from '#start/env'
import { resolve4 } from 'node:dns/promises'

const smtpHostname = env.get('SMTP_HOST', 'localhost')
// Nodemailer can randomly select an AAAA record even when the Render service
// has no IPv6 route. Resolve the host to an IPv4 address before it connects.
const smtpHost = await resolve4(smtpHostname)
    .then((addresses) => addresses[0] || smtpHostname)
    .catch(() => smtpHostname)

const mailConfig = defineConfig({
    default: 'smtp',
    mailers: {
        smtp: transports.smtp({
            host: smtpHost,
            port: env.get('SMTP_PORT', 1025),
            secure: env.get('SMTP_SECURE', env.get('SMTP_PORT', 1025) === 465),
            tls: { servername: smtpHostname },
            auth: {
                type: 'login',
                user: env.get('SMTP_USERNAME', ''),
                pass: env.get('SMTP_PASSWORD', ''),
            },
        }),
    },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
    export interface MailersList extends InferMailers<typeof mailConfig> { }
}
