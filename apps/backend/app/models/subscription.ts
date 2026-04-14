import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Plan from '#models/plan'

export default class Subscription extends BaseModel {
  static table = 'subscriptions'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'plan_id' })
  declare planId: number | null

  @column()
  declare status: 'trialing' | 'active' | 'grace' | 'expired' | 'cancelled'

  @column({ columnName: 'billing_cycle' })
  declare billingCycle: 'trial' | 'monthly' | 'yearly'

  @column.date({ columnName: 'start_date' })
  declare startDate: DateTime

  @column.date({ columnName: 'end_date' })
  declare endDate: DateTime | null

  @column.date({ columnName: 'trial_start_date' })
  declare trialStartDate: DateTime | null

  @column.date({ columnName: 'trial_end_date' })
  declare trialEndDate: DateTime | null

  @column.date({ columnName: 'grace_end_date' })
  declare graceEndDate: DateTime | null

  @column({ columnName: 'auto_renew' })
  declare autoRenew: boolean

  @column({ columnName: 'payment_gateway' })
  declare paymentGateway: string | null

  @column({ columnName: 'external_subscription_id' })
  declare externalSubscriptionId: string | null

  @column()
  declare metadata: any

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Organization, { foreignKey: 'orgId' })
  declare organization: BelongsTo<typeof Organization>

  @belongsTo(() => Plan, { foreignKey: 'planId' })
  declare plan: BelongsTo<typeof Plan>
}
