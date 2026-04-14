import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Employee from '#models/employee'
import Permission from '#models/permission'

export default class UserPermission extends BaseModel {
  static table = 'user_permissions'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'employee_id' })
  declare employeeId: number

  @column({ columnName: 'permission_id' })
  declare permissionId: number

  @column()
  declare effect: 'allow' | 'deny'

  @column.dateTime({ columnName: 'starts_at' })
  declare startsAt: DateTime | null

  @column.dateTime({ columnName: 'ends_at' })
  declare endsAt: DateTime | null

  @column({ columnName: 'granted_by' })
  declare grantedBy: number | null

  @column.dateTime({ columnName: 'granted_at' })
  declare grantedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee, { foreignKey: 'employeeId' })
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => Permission, { foreignKey: 'permissionId' })
  declare permission: BelongsTo<typeof Permission>
}
