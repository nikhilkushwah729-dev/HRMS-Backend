import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class Expense extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column()
    declare category: string

    @column()
    declare amount: number

    @column.date()
    declare expenseDate: DateTime

    @column()
    declare description: string | null

    @column()
    declare receiptUrl: string | null

    @column()
    declare projectId: number | null

    @column()
    declare status: 'pending' | 'approved' | 'rejected'

    @column({ columnName: 'approved_by' })
    declare approvedBy: number | null

    @column.dateTime()
    declare approvedAt: DateTime | null

    @column({ columnName: 'rejection_note' })
    declare rejectionNote: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'approvedBy' })
    declare approver: BelongsTo<typeof Employee>
}