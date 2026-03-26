import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import AddonPrice from '#models/addon_price'

export default class OrganizationAddon extends BaseModel {
    static table = 'organization_addons'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare addonId: number

    @column.date()
    declare startDate: DateTime

    @column.date()
    declare endDate: DateTime | null

    @column()
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization)
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => AddonPrice, { foreignKey: 'addonId' })
    declare addon: BelongsTo<typeof AddonPrice>
}