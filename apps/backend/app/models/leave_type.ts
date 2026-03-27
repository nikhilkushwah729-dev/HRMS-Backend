import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Leave from '#models/leave'

export default class LeaveType extends BaseModel {
    static table = 'leave_types'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'type_name' })
    declare typeName: string

    @column({ columnName: 'days_allowed' })
    declare daysAllowed: number

    @column({ columnName: 'carry_forward' })
    declare carryForward: boolean

    @column({ columnName: 'max_carry_days' })
    declare maxCarryDays: number

    @column({ columnName: 'is_paid' })
    declare isPaid: boolean

    @column({ columnName: 'requires_doc' })
    declare requiresDoc: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => Leave, { foreignKey: 'leaveTypeId' })
    declare leaves: HasMany<typeof Leave>
}
