import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Plan from '#models/plan'

export default class Payment extends BaseModel {
    static table = 'payments'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'plan_id' })
    declare planId: number | null

    @column()
    declare amount: number

    @column()
    declare currency: string

    @column({ columnName: 'transaction_id' })
    declare transactionId: string | null // UNIQUE [S6]

    @column({ columnName: 'payment_gateway' })
    declare paymentGateway: 'razorpay' | 'stripe' | 'manual' | null

    @column()
    declare status: 'pending' | 'success' | 'failed' | 'refunded' | 'disputed'

    @column({ columnName: 'payment_method' })
    declare paymentMethod: string | null

    @column()
    declare provider: string | null

    @column({ columnName: 'provider_order_id' })
    declare providerOrderId: string | null

    @column({ columnName: 'provider_payment_id' })
    declare providerPaymentId: string | null

    @column({ columnName: 'provider_signature' })
    declare providerSignature: string | null

    @column({ columnName: 'billing_cycle' })
    declare billingCycle: string | null

    @column({ columnName: 'failure_reason' })
    declare failureReason: string | null

    @column({ columnName: 'invoice_url' })
    declare invoiceUrl: string | null

    @column({ columnName: 'webhook_event_id' })
    declare webhookEventId: string | null

    @column()
    declare metadata: any

    @column({ columnName: 'gateway_response' })
    declare gatewayResponse: any

    @column.dateTime({ columnName: 'paid_at' })
    declare paidAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Plan, { foreignKey: 'planId' })
    declare plan: BelongsTo<typeof Plan>
}
