import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class Payroll extends BaseModel {
    static table = 'payrolls'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare month: number

    @column()
    declare year: number

    @column()
    declare basicSalary: number

    @column()
    declare hra: number

    @column()
    declare allowances: number

    @column()
    declare bonus: number

    @column()
    declare grossSalary: number // GENERATED ALWAYS AS STORED in SQL

    @column()
    declare pfDeduction: number

    @column()
    declare esiDeduction: number

    @column()
    declare tdsDeduction: number

    @column()
    declare otherDeductions: number

    @column()
    declare totalDeductions: number // GENERATED ALWAYS AS STORED in SQL

    @column()
    declare netSalary: number // GENERATED ALWAYS AS STORED in SQL

    @column.date()
    declare paymentDate: DateTime | null

    @column()
    declare paymentMode: 'bank_transfer' | 'cash' | 'cheque' | null

    @column()
    declare paymentRef: string | null

    @column()
    declare status: 'draft' | 'processed' | 'paid' | 'failed' | 'reversed'

    @column()
    declare processedBy: number | null

    @column()
    declare isLocked: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'processedBy' })
    declare processor: BelongsTo<typeof Employee>
}
