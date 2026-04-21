import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Payment from '#models/payment'

export default class Invoice extends BaseModel {
    static table = 'invoices'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare paymentId: number | null

    @column()
    declare invoiceNumber: string

    // The actual DB column is 'subtotal' (not 'amount')
    @column()
    declare subtotal: number

    // tax_percent defaults to 18.00 in DB; insert only to override
    @column({ columnName: 'tax_percent' })
    declare taxPercent: number | null

    // tax_amount and total are GENERATED columns — read-only, never insert them
    @column({ columnName: 'tax_amount' })
    declare taxAmount: number

    @column()
    declare total: number

    @column({ columnName: 'is_void' })
    declare isVoid: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Payment, { foreignKey: 'paymentId' })
    declare payment: BelongsTo<typeof Payment>
}