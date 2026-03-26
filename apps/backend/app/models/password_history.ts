import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'

export default class PasswordHistory extends BaseModel {
    static table = 'password_history'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare passwordHash: string

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>
}