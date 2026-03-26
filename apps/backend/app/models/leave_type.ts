import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Leave from '#models/leave'

export default class LeaveType extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare typeName: string

    @column()
    declare daysAllowed: number

    @column()
    declare carryForward: boolean

    @column()
    declare maxCarryDays: number

    @column()
    declare isPaid: boolean

    @column()
    declare requiresDoc: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Organization)
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => Leave)
    declare leaves: HasMany<typeof Leave>
}