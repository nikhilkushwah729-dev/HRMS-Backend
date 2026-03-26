import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class UserSession extends BaseModel {
    static table = 'user_sessions'

    @column({ isPrimary: true })
    declare id: string // BIGINT

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare sessionToken: string

    @column()
    declare refreshToken: string | null

    @column()
    declare deviceInfo: string | null

    @column()
    declare ipAddress: string | null

    @column()
    declare userAgent: string | null

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare lastActivity: DateTime

    @column.dateTime()
    declare expiresAt: DateTime

    @column()
    declare isRevoked: boolean

    @column.dateTime()
    declare revokedAt: DateTime | null

    @column()
    declare revokedReason: 'logout' | 'password_change' | 'admin_action' | 'expired' | 'security' | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}