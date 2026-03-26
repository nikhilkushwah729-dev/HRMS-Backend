import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'

export default class Holiday extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare name: string

    @column.date()
    declare holidayDate: DateTime

    @column()
    declare type: 'national' | 'company' | 'optional'

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}
