import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class Kiosk extends BaseModel {
  static table = 'kiosks'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'org_location_id' })
  declare orgLocationId: number | null

  @column()
  declare name: string

  @column()
  declare location: string

  @column({ columnName: 'device_id' })
  declare deviceId: string

  @column({ columnName: 'device_token', serializeAs: null })
  declare deviceToken: string | null

  @column()
  declare status: 'pending' | 'active' | 'inactive' | 'blocked'

  @column.dateTime({ columnName: 'last_seen_at' })
  declare lastSeenAt: DateTime | null

  @column({ columnName: 'registered_by' })
  declare registeredBy: number | null

  @column({ columnName: 'approved_by' })
  declare approvedBy: number | null

  @column.dateTime({ columnName: 'approved_at' })
  declare approvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Organization, { foreignKey: 'orgId' })
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => Employee, { foreignKey: 'approvedBy' })
  declare approver: BelongsTo<typeof Employee>
}
