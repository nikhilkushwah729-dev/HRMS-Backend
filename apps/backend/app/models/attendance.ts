import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import Shift from '#models/shift'

export default class Attendance extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare shiftId: number | null

    @column.date()
    declare attendanceDate: DateTime

    @column.dateTime()
    declare checkIn: DateTime | null

    @column.dateTime()
    declare checkOut: DateTime | null

    @column()
    declare workHours: number | null // GENERATED ALWAYS AS STORED in SQL

    @column()
    declare checkInLat: number | null

    @column()
    declare checkInLng: number | null

    @column()
    declare checkOutLat: number | null

    @column()
    declare checkOutLng: number | null

    @column()
    declare deviceInfo: string | null

    @column()
    declare selfieUrl: string | null

    @column()
    declare biometricRef: string | null

    @column()
    declare status: 'present' | 'absent' | 'half_day' | 'late' | 'on_leave' | 'holiday' | 'weekend'

    @column()
    declare isLate: boolean

    @column()
    declare isHalfDay: boolean

    @column()
    declare isOvertime: boolean

    @column()
    declare totalBreakMin: number

    @column()
    declare netWorkHours: number

    @column()
    declare source: 'manual' | 'biometric' | 'mobile' | 'web' | 'geo_fence' | 'camera' | 'face'

    // Break tracking
    @column.dateTime()
    declare breakStart: DateTime | null

    @column.dateTime()
    declare breakEnd: DateTime | null

    @column()
    declare breakDuration: number | null

    @column()
    declare notes: string | null

    @column()
    declare modifiedBy: number | null

    @column.dateTime()
    declare modifiedAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Shift, { foreignKey: 'shiftId' })
    declare shift: BelongsTo<typeof Shift> | null
}
