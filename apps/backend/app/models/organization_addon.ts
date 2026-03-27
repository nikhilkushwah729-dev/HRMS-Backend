import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import AddonPrice from '#models/addon_price'

export default class OrganizationAddon extends BaseModel {
    static table = 'organization_addons'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'addon_id' })
    declare addonId: number

    @column.date({ columnName: 'start_date' })
    declare startDate: DateTime

    @column.date({ columnName: 'end_date' })
    declare endDate: DateTime | null

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => AddonPrice, { foreignKey: 'addonId' })
    declare addon: BelongsTo<typeof AddonPrice>
}
