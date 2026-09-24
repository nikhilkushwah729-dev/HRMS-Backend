import Employee from '#models/employee'
import Role from '#models/role'

export interface CSVEmployeeRow {
  employeeCode?: string
  firstName: string
  lastName?: string
  email: string
  phone?: string
  gender?: 'male' | 'female' | 'other'
  salary?: number
  panNumber?: string
  bankAccount?: string
  ifscCode?: string
  roleName?: string
}

export interface SettlementInput {
  basicSalary: number
  unpaidWorkDays: number
  totalWorkingDaysInMonth: number
  encashableLeaveDays: number
  gratuityYearsCompleted: number
  noticePeriodShortfallDays: number
}

export interface SettlementResult {
  unpaidSalaryAmount: number
  leaveEncashmentAmount: number
  gratuityAmount: number
  noticeDeductionAmount: number
  grossSettlement: number
  netSettlement: number
}

export default class EmployeeImportService {
  /**
   * Bulk CSV Employee Import Processor
   */
  static async processBulkImport(
    orgId: number,
    rows: CSVEmployeeRow[]
  ): Promise<{ created: number; skipped: number; errors: Array<{ row: number; email: string; reason: string }> }> {
    let created = 0
    let skipped = 0
    const errors: Array<{ row: number; email: string; reason: string }> = []

    const defaultRole = await Role.query()
      .where('role_name', 'Employee')
      .where((q) => q.where('org_id', orgId).orWhereNull('org_id'))
      .first()

    const defaultRoleId = defaultRole ? defaultRole.id : 5

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const email = String(row.email || '').trim().toLowerCase()

      if (!email || !row.firstName) {
        errors.push({ row: i + 1, email, reason: 'Missing required field (email or firstName)' })
        continue
      }

      // Duplicate check
      const existing = await Employee.query().where('email', email).first()
      if (existing) {
        skipped++
        errors.push({ row: i + 1, email, reason: 'Employee with this email already exists' })
        continue
      }

      const emp = new Employee()
      emp.orgId = orgId
      emp.firstName = row.firstName
      emp.lastName = row.lastName ?? null
      emp.email = email
      emp.phone = row.phone ?? null
      emp.roleId = defaultRoleId
      emp.gender = row.gender ?? 'male'
      emp.salary = Number(row.salary ?? 0)
      emp.panNumber = row.panNumber ?? null
      emp.bankAccount = row.bankAccount ?? null
      emp.ifscCode = row.ifscCode ?? null
      emp.status = 'active'
      emp.mustChangePassword = true

      await emp.save()
      created++
    }

    return { created, skipped, errors }
  }

  /**
   * Full & Final (F&F) Settlement Calculator
   * Gratuity Formula (Gratuity Act 1972): (15 * Last Drawn Basic * Years Completed) / 26
   * Leave Encashment: (Basic / 30) * Encashable Days
   */
  static calculateFnFSettlement(input: SettlementInput): SettlementResult {
    const dailyBasic = input.basicSalary / (input.totalWorkingDaysInMonth || 30)
    
    // 1. Unpaid Salary for current month
    const unpaidSalaryAmount = Math.round(dailyBasic * input.unpaidWorkDays)

    // 2. Leave Encashment
    const leaveEncashmentAmount = Math.round(dailyBasic * input.encashableLeaveDays)

    // 3. Gratuity (if >= 5 years completed)
    let gratuityAmount = 0
    if (input.gratuityYearsCompleted >= 5) {
      gratuityAmount = Math.round((15 * input.basicSalary * input.gratuityYearsCompleted) / 26)
    }

    // 4. Notice Period Recovery
    const noticeDeductionAmount = Math.round(dailyBasic * input.noticePeriodShortfallDays)

    const grossSettlement = unpaidSalaryAmount + leaveEncashmentAmount + gratuityAmount
    const netSettlement = Math.max(0, grossSettlement - noticeDeductionAmount)

    return {
      unpaidSalaryAmount,
      leaveEncashmentAmount,
      gratuityAmount,
      noticeDeductionAmount,
      grossSettlement,
      netSettlement,
    }
  }
}
