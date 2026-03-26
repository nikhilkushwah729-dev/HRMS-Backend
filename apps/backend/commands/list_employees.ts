import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Employee from '#models/employee'

export default class ListEmployees extends BaseCommand {
  static commandName = 'list:employees'
  static description = 'List all employees'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const employees = await Employee.all()

    if (employees.length === 0) {
      this.logger.info('No employees found.')
      return
    }

    this.logger.info('Listing all employees:')
    employees.forEach((emp) => {
      const hash = emp.passwordHash ? emp.passwordHash.substring(0, 10) : 'NULL'
      this.logger.log(`ID: ${emp.id} | Email: ${emp.email} | Hash: ${hash}...`)
    })
  }
}