import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import LeaveType from '#models/leave_type'

export default class LeaveBalance extends BaseModel {
    static table = 'leave_balances'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'leave_type_id' })
    declare leaveTypeId: number

    @column()
    declare year: number

    @column({ columnName: 'total_days' })
    declare totalDays: number

    @column({ columnName: 'used_days' })
    declare usedDays: number

    @column({ columnName: 'remaining_days' })
    declare remainingDays: number

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => LeaveType, { foreignKey: 'leaveTypeId' })
    declare leaveType: BelongsTo<typeof LeaveType>
}

