import Payroll from '#models/payroll'
import PayrollSetting from '#models/payroll_setting'
import Employee from '#models/employee'
import { Exception } from '@adonisjs/core/exceptions'

export default class PayrollService {
    /**
     * Generate payroll for an employee
     */
    async generate(employeeId: number, orgId: number, month: number, year: number) {
        const employee = await Employee.query().where('id', employeeId).where('org_id', orgId).first()
        if (!employee) throw new Exception('Employee not found', { status: 404 })

        const settings = await PayrollSetting.query().where('org_id', orgId).first()
        if (!settings) throw new Exception('Payroll settings not found', { status: 404 })

        const baseSalary = employee.salary
        const pf = (baseSalary * settings.pfPercent) / 100
        const esi = (baseSalary * settings.esiPercent) / 100
        const tds = (baseSalary * settings.tdsPercent) / 100

        const totalDeductions = pf + esi + tds
        const netSalary = baseSalary - totalDeductions

        return await Payroll.create({
            employeeId,
            orgId,
            month,
            year,
            basicSalary: baseSalary,
            pfDeduction: pf,
            esiDeduction: esi,
            tdsDeduction: tds,
            totalDeductions,
            netSalary,
            status: 'draft',
        })
    }

    /**
     * List payrolls
     */
    async list(orgId: number, month?: number, year?: number) {
        const query = Payroll.query().where('org_id', orgId)
        if (month) query.where('month', month)
        if (year) query.where('year', year)
        return await query.preload('employee')
    }
}
