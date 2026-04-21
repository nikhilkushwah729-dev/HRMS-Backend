import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import Attendance from '#models/attendance'

export default class AttendanceRegularization extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'attendance_id' })
    declare attendanceId: number | null

    @column.date({ columnName: 'regularization_date' })
    declare regularizationDate: DateTime

    @column({ columnName: 'check_in' })
    declare checkIn: string | null

    @column({ columnName: 'check_out' })
    declare checkOut: string | null

    @column()
    declare type: 'missed_punch' | 'late_arrival' | 'half_day' | 'other'

    @column()
    declare reason: string

    @column()
    declare status: 'pending' | 'approved' | 'rejected'

    @column({ columnName: 'admin_notes' })
    declare adminNotes: string | null

    @column({ columnName: 'rejection_reason' })
    declare rejectionReason: string | null

    @column({ columnName: 'approved_by' })
    declare approvedBy: number | null

    @column.dateTime({ columnName: 'approved_at' })
    declare approvedAt: DateTime | null

    @column.dateTime({ autoCreate: true, columnName: 'created_at' })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
    declare updatedAt: DateTime

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Attendance, { foreignKey: 'attendanceId' })
    declare attendance: BelongsTo<typeof Attendance>
}
