import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class MagicLinkToken extends BaseModel {
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
}