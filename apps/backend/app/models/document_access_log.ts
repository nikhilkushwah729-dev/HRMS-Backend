import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/document'
import Employee from '#models/employee'

export default class DocumentAccessLog extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare documentId: number

    @column()
    declare employeeId: number

    @column()
    declare ipAddress: string | null

    @column.dateTime({ autoCreate: true })
    declare accessedAt: DateTime

    // Relationships
    @belongsTo(() => Document, { foreignKey: 'documentId' })
    declare document: BelongsTo<typeof Document>

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>
}