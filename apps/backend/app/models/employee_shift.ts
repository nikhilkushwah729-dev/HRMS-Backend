import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Shift from '#models/shift'

export default class EmployeeShift extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare shiftId: number

    @column.date()
    declare effectiveFrom: DateTime

    @column.date()
    declare effectiveTo: DateTime | null

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Shift, { foreignKey: 'shiftId' })
    declare shift: BelongsTo<typeof Shift>
}