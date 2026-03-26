import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TrustedDevice extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare deviceId: string

    @column()
    declare deviceName: string | null

    @column.dateTime({ autoCreate: true })
    declare trustedAt: DateTime

    @column.dateTime()
    declare lastUsedAt: DateTime | null
}