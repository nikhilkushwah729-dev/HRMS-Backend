import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Notification extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare title: string

    @column()
    declare message: string

    @column()
    declare type: 'info' | 'success' | 'warning' | 'error' | null

    @column()
    declare link: string | null

    @column()
    declare isRead: boolean

    @column.dateTime()
    declare readAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime
}