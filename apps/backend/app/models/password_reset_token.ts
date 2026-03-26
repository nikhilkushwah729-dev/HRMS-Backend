import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'

export default class PasswordResetToken extends BaseModel {
    static table = 'password_reset_tokens'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare token: string

    @column.dateTime()
    declare expiresAt: DateTime

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>
}