import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import LeaveType from '#models/leave_type'

export default class Leave extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'leave_type_id' })
    declare leaveTypeId: number | null

    @column.date()
    declare startDate: DateTime

    @column.date()
    declare endDate: DateTime

    @column()
    declare totalDays: number // GENERATED ALWAYS AS STORED in SQL

    @column()
    declare reason: string | null

    @column()
    declare supportingDoc: string | null

    @column()
    declare status: 'pending' | 'approved' | 'rejected' | 'cancelled'

    @column({ columnName: 'approved_by' })
    declare approvedBy: number | null

    @column.dateTime()
    declare approvedAt: DateTime | null

    @column({ columnName: 'rejection_note' })
    declare rejectionNote: string | null

    @column()
    declare cancelledBy: number | null

    @column.dateTime()
    declare cancelledAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => LeaveType, { foreignKey: 'leaveTypeId' })
    declare leaveType: BelongsTo<typeof LeaveType>

    @belongsTo(() => Employee, { foreignKey: 'approvedBy' })
    declare approver: BelongsTo<typeof Employee>
}