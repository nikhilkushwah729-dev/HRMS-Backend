import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class LoginAttempt extends BaseModel {
    static table = 'login_attempts'

    @column({ isPrimary: true })
    declare id: string // BIGINT

    @column()
    declare employeeId: number | null

    @column()
    declare orgId: number | null

    @column()
    declare email: string

    @column()
    declare ipAddress: string

    @column()
    declare userAgent: string | null

    @column()
    declare attemptType: 'password' | 'otp' | 'magic_link'

    @column()
    declare status: 'success' | 'failed' | 'blocked'

    @column()
    declare failureReason: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}