import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Plan from '#models/plan'

export default class Payment extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare planId: number | null

    @column()
    declare amount: number

    @column()
    declare currency: string

    @column()
    declare transactionId: string // UNIQUE [S6]

    @column()
    declare paymentGateway: 'razorpay' | 'stripe' | 'manual'

    @column()
    declare status: 'pending' | 'completed' | 'failed' | 'refunded'

    @column()
    declare paymentMethod: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Plan, { foreignKey: 'planId' })
    declare plan: BelongsTo<typeof Plan>
}