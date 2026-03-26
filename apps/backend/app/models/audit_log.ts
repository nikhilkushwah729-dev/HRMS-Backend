import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'

export default class AuditLog extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number | null

    @column()
    declare employeeId: number | null

    @column()
    declare action: string

    @column()
    declare module: string

    @column()
    declare entityName: string | null

    @column()
    declare entityId: string | null

    @column()
    declare oldValues: any

    @column()
    declare newValues: any

    @column()
    declare ipAddress: string | null

    @column()
    declare userAgent: string | null

    @column()
    declare countryCode: string | null

    @column()
    declare countryName: string | null

    @column()
    declare regionName: string | null

    @column()
    declare cityName: string | null

    @column()
    declare latitude: number | null

    @column()
    declare longitude: number | null

    @column()
    declare isImmutable: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>
}