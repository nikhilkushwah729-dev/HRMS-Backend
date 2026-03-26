import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class RefreshToken extends BaseModel {
    static table = 'refresh_tokens'

    @column({ isPrimary: true })
    declare id: string // BIGINT

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare tokenHash: string

    @column()
    declare parentTokenHash: string | null

    @column()
    declare deviceId: string | null

    @column()
    declare isRememberMe: boolean

    @column.dateTime()
    declare expiresAt: DateTime

    @column()
    declare isRevoked: boolean

    @column.dateTime()
    declare revokedAt: DateTime | null

    @column()
    declare revokedReason: 'logout' | 'rotation' | 'password_change' | 'admin_action' | 'suspicious' | null

    @column()
    declare ipAddress: string | null

    @column()
    declare userAgent: string | null

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare lastUsedAt: DateTime

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}