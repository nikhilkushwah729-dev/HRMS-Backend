import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class EmailVerificationToken extends BaseModel {
    static table = 'email_verification_tokens'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number | null

    @column()
    declare orgId: number | null

    @column()
    declare email: string

    @column()
    declare token: string

    @column()
    declare tokenHash: string

    @column()
    declare purpose: 'signup' | 'email_change' | 'org_registration'

    @column()
    declare isUsed: boolean

    @column.dateTime()
    declare usedAt: DateTime | null

    @column.dateTime()
    declare expiresAt: DateTime

    @column()
    declare ipAddress: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}