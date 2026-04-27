import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Kiosk from '#models/kiosk'
import Organization from '#models/organization'

export default class AttendanceLog extends BaseModel {
  static table = 'attendance_logs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'employee_id' })
  declare employeeId: number | null

  @column({ columnName: 'kiosk_id' })
  declare kioskId: number | null

  @column.date({ columnName: 'attendance_date' })
  declare attendanceDate: DateTime

  @column()
  declare type: 'check_in' | 'check_out'

  @column()
  declare method: 'face' | 'pin' | 'qr'

  @column.dateTime({ columnName: 'timestamp' })
  declare timestamp: DateTime

  @column({ columnName: 'shift_id' })
  declare shiftId: number | null

  @column()
  declare status: 'success' | 'failed' | 'suspicious'

  @column({ columnName: 'late_minutes' })
  declare lateMinutes: number

  @column({ columnName: 'early_exit_minutes' })
  declare earlyExitMinutes: number

  @column({ columnName: 'overtime_minutes' })
  declare overtimeMinutes: number

  @column({ columnName: 'ip_address' })
  declare ipAddress: string | null

  @column({ columnName: 'device_id' })
  declare deviceId: string | null

  @column({ columnName: 'client_reference' })
  declare clientReference: string | null

  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column({ columnName: 'failure_reason' })
  declare failureReason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee, { foreignKey: 'employeeId' })
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => Kiosk, { foreignKey: 'kioskId' })
  declare kiosk: BelongsTo<typeof Kiosk>

  @belongsTo(() => Organization, { foreignKey: 'orgId' })
  declare organization: BelongsTo<typeof Organization>
}
