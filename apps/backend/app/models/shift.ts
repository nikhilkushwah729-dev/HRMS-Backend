import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import EmployeeShift from '#models/employee_shift'

export default class Shift extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column({ columnName: 'name' })
    declare name: string

    @column()
    declare startTime: string // TIME in SQL

    @column()
    declare endTime: string // TIME in SQL

    @column({ columnName: 'grace_time' })
    declare graceTime: number

    @column()
    declare workDays: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => EmployeeShift)
    declare employeeShifts: HasMany<typeof EmployeeShift>
}