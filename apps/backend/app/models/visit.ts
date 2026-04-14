import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Visit extends BaseModel {
  static table = 'visits'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'client_id' })
  declare clientId: number | null

  @column({ columnName: 'visitor_id' })
  declare visitorId: number | null

  @column({ columnName: 'host_employee_id' })
  declare hostEmployeeId: number | null

  @column({ columnName: 'created_by' })
  declare createdBy: number

  @column({ columnName: 'approver_employee_id' })
  declare approverEmployeeId: number | null

  @column({ columnName: 'approved_by' })
  declare approvedBy: number | null

  @column()
  declare title: string

  @column()
  declare purpose: string

  @column({ columnName: 'location_name' })
  declare locationName: string | null

  @column({ columnName: 'visit_type' })
  declare visitType: string

  @column()
  declare priority: string

  @column()
  declare status: string

  @column({ columnName: 'requires_approval' })
  declare requiresApproval: boolean

  @column.dateTime({ columnName: 'scheduled_start' })
  declare scheduledStart: DateTime

  @column.dateTime({ columnName: 'scheduled_end' })
  declare scheduledEnd: DateTime | null

  @column.dateTime({ columnName: 'reminder_at' })
  declare reminderAt: DateTime | null

  @column.dateTime({ columnName: 'approved_at' })
  declare approvedAt: DateTime | null

  @column.dateTime({ columnName: 'actual_check_in_at' })
  declare actualCheckInAt: DateTime | null

  @column.dateTime({ columnName: 'actual_check_out_at' })
  declare actualCheckOutAt: DateTime | null

  @column({ columnName: 'check_in_latitude' })
  declare checkInLatitude: number | null

  @column({ columnName: 'check_in_longitude' })
  declare checkInLongitude: number | null

  @column({ columnName: 'check_out_latitude' })
  declare checkOutLatitude: number | null

  @column({ columnName: 'check_out_longitude' })
  declare checkOutLongitude: number | null

  @column({ columnName: 'check_in_address' })
  declare checkInAddress: string | null

  @column({ columnName: 'check_out_address' })
  declare checkOutAddress: string | null

  @column({ columnName: 'photo_proof_url' })
  declare photoProofUrl: string | null

  @column({ columnName: 'attachment_urls' })
  declare attachmentUrls: string | null

  @column({ columnName: 'approval_notes' })
  declare approvalNotes: string | null

  @column({ columnName: 'completion_notes' })
  declare completionNotes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
