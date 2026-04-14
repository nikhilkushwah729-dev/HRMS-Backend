import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class VisitFollowUp extends BaseModel {
  static table = 'visit_follow_ups'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'visit_id' })
  declare visitId: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'assigned_to' })
  declare assignedTo: number | null

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column()
  declare status: string

  @column()
  declare priority: string

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column.dateTime({ columnName: 'due_at' })
  declare dueAt: DateTime | null

  @column.dateTime({ columnName: 'completed_at' })
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
