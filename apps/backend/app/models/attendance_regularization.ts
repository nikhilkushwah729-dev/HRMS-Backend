import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import Attendance from '#models/attendance'

export default class AttendanceRegularization extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare attendanceId: number | null

    @column.date()
    declare regularizationDate: DateTime

    @column()
    declare type: 'missed_punch' | 'late_arrival' | 'half_day' | 'other'

    @column()
    declare reason: string

    @column()
    declare status: 'pending' | 'approved' | 'rejected'

    @column()
    declare adminNotes: string | null

    @column()
    declare approvedBy: number | null

    @column.dateTime()
    declare approvedAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Attendance, { foreignKey: 'attendanceId' })
    declare attendance: BelongsTo<typeof Attendance>
}
