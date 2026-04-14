import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'

export default class Plan extends BaseModel {
    static table = 'plans'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare name: string

    @column()
    declare slug: string | null

    @column()
    declare price: number

    @column({ columnName: 'monthly_price' })
    declare monthlyPrice: number

    @column({ columnName: 'yearly_price' })
    declare yearlyPrice: number

    @column()
    declare currency: string

    @column({ columnName: 'user_limit' })
    declare userLimit: number

    @column({ columnName: 'storage_limit_mb' })
    declare storageLimitMb: number

    @column({ columnName: 'duration_days' })
    declare durationDays: number

    @column()
    declare features: any

    @column()
    declare modules: any

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column({ columnName: 'is_public' })
    declare isPublic: boolean

    @column({ columnName: 'is_trial_plan' })
    declare isTrialPlan: boolean

    @column({ columnName: 'sort_order' })
    declare sortOrder: number

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @hasMany(() => Organization)
    declare organizations: HasMany<typeof Organization>
}
