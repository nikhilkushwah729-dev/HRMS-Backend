import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class VisitClient extends BaseModel {
  static table = 'visit_clients'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column()
  declare name: string

  @column()
  declare industry: string | null

  @column({ columnName: 'contact_person' })
  declare contactPerson: string | null

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare address: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
