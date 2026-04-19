import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Employee from '#models/employee'
import AuthorizationService from '#services/AuthorizationService'

export default class NormalizeOrgSuperAdmins extends BaseCommand {
  static commandName = 'normalize:org-super-admins'
  static description =
    'Convert incorrectly org-bound Super Admin users into Admin users without touching the true platform Super Admin'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const authorizationService = new AuthorizationService()

    const employees = await Employee.query()
      .whereHas('role', (query) => {
        query.where('role_name', 'Super Admin').whereNotNull('org_id')
      })
      .preload('role')

    if (employees.length === 0) {
      this.logger.success('No incorrectly org-bound Super Admin users found.')
      return
    }

    this.logger.info(`Found ${employees.length} org-bound Super Admin user(s). Normalizing roles...`)

    let updated = 0

    for (const employee of employees) {
      const previousRoleName = employee.role?.roleName || 'Unknown'
      await authorizationService.normalizeLegacyOrganizationRole(employee)
      updated += 1
      this.logger.log(
        `Updated employee ID ${employee.id} (${employee.email || employee.fullName}) from ${previousRoleName} to ${employee.role?.roleName || 'Admin'}`
      )
    }

    this.logger.success(`Normalization complete. Updated ${updated} user(s).`)
  }
}
