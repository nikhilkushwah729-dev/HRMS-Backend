import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OrganizationAddon from '#models/organization_addon'

/**
 * AddonPrice - The canonical model for HRMS modules/addons.
 * (Previously duplicated as 'AddonPrice.ts'. All imports should use '#models/addon_price')
 */
export default class AddonPrice extends BaseModel {
    static table = 'addon_prices'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare slug: string

    @column()
    declare description: string | null

    @column()
    declare price: number

    @column()
    declare planType: number | null

    @column()
    declare isActive: boolean

    @hasMany(() => OrganizationAddon, { foreignKey: 'addonId' })
    declare organizations: HasMany<typeof OrganizationAddon>

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime
}