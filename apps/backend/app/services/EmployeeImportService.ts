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
}
