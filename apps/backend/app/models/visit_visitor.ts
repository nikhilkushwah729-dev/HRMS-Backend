import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class VisitVisitor extends BaseModel {
  static table = 'visit_visitors'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'client_id' })
  declare clientId: number | null

  @column({ columnName: 'full_name' })
  declare fullName: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare designation: string | null

  @column()
  declare address: string | null

  @column()
  declare notes: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
