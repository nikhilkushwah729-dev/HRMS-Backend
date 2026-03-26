import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class OtpToken extends BaseModel {
    static table = 'otp_tokens'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number | null

    @column()
    declare orgId: number | null

    @column()
    declare email: string

    @column()
    declare otpHash: string

    @column()
    declare purpose: 'login_2fa' | 'password_reset' | 'email_verify' | 'phone_verify' | 'withdrawal' | 'org_signup' | 'phone_login' | 'email_verification'

    @column()
    declare channel: 'email' | 'sms' | 'authenticator_app' | 'authenticator'

    @column()
    declare attempts: number

    @column()
    declare maxAttempts: number

    @column()
    declare isUsed: boolean

    @column.dateTime()
    declare expiresAt: DateTime

    @column.dateTime()
    declare usedAt: DateTime | null

    @column()
    declare ipAddress: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}