import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class Payroll extends BaseModel {
    static table = 'payrolls'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column()
    declare month: number

    @column()
    declare year: number

    @column({ columnName: 'basic_salary' })
    declare basicSalary: number

    @column()
    declare hra: number

    @column()
    declare allowances: number

    @column()
    declare bonus: number

    @column({ columnName: 'gross_salary' })
    declare grossSalary: number

    @column({ columnName: 'pf_deduction' })
    declare pfDeduction: number

    @column({ columnName: 'esi_deduction' })
    declare esiDeduction: number

    @column({ columnName: 'tds_deduction' })
    declare tdsDeduction: number

    @column({ columnName: 'other_deductions' })
    declare otherDeductions: number

    @column({ columnName: 'total_deductions' })
    declare totalDeductions: number

    @column({ columnName: 'net_salary' })
    declare netSalary: number

    @column.date({ columnName: 'payment_date' })
    declare paymentDate: DateTime | null

    @column({ columnName: 'payment_mode' })
    declare paymentMode: 'bank_transfer' | 'cash' | 'cheque' | null

    @column({ columnName: 'payment_ref' })
    declare paymentRef: string | null

    @column()
    declare status: 'draft' | 'processed' | 'paid' | 'failed' | 'reversed'

    @column({ columnName: 'processed_by' })
    declare processedBy: number | null

    @column({ columnName: 'is_locked' })
    declare isLocked: boolean

    @column.dateTime({ autoCreate: true, columnName: 'created_at' })
    declare createdAt: DateTime

    @beforeSave()
    public static calculateTotals(payroll: Payroll) {
        const basic = Number(payroll.basicSalary || 0)
        const hra = Number(payroll.hra || 0)
        const allowances = Number(payroll.allowances || 0)
        const bonus = Number(payroll.bonus || 0)

        const pf = Number(payroll.pfDeduction || 0)
        const esi = Number(payroll.esiDeduction || 0)
        const tds = Number(payroll.tdsDeduction || 0)
        const other = Number(payroll.otherDeductions || 0)

        payroll.grossSalary = basic + hra + allowances + bonus
        payroll.totalDeductions = pf + esi + tds + other
        payroll.netSalary = payroll.grossSalary - payroll.totalDeductions
    }

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'processedBy' })
    declare processor: BelongsTo<typeof Employee>
}
