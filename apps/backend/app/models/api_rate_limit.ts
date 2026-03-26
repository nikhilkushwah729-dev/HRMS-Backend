import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ApiRateLimit extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare identifier: string

    @column()
    declare endpoint: string

    @column()
    declare requestCount: number

    @column.dateTime()
    declare windowStart: DateTime

    @column.dateTime()
    declare windowEnd: DateTime

    @column()
    declare isBlocked: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}