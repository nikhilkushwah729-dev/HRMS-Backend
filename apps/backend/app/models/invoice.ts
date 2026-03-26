import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Payment from '#models/payment'

export default class Invoice extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare paymentId: number | null

    @column()
    declare invoiceNumber: string

    @column.date()
    declare invoiceDate: DateTime

    @column()
    declare amount: number

    @column()
    declare taxAmount: number

    @column()
    declare totalAmount: number

    @column()
    declare pdfUrl: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Payment, { foreignKey: 'paymentId' })
    declare payment: BelongsTo<typeof Payment>
}