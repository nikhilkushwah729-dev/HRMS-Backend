import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Plan from '#models/plan'

export default class FeatureLimit extends BaseModel {
  static table = 'feature_limits'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'plan_id' })
  declare planId: number

  @column({ columnName: 'feature_key' })
  declare featureKey: string

  @column({ columnName: 'feature_label' })
  declare featureLabel: string | null

  @column({ columnName: 'feature_type' })
  declare featureType: 'boolean' | 'number' | 'json'

  @column({ columnName: 'is_enabled' })
  declare isEnabled: boolean

  @column({ columnName: 'limit_value' })
  declare limitValue: string | null

  @column()
  declare metadata: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Plan, { foreignKey: 'planId' })
  declare plan: BelongsTo<typeof Plan>
}
