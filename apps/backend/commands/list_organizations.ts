import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Organization from '#models/organization'

export default class ListOrganizations extends BaseCommand {
  static commandName = 'list:organizations'
  static description = 'List all organizations'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const orgs = await Organization.all()

    if (orgs.length === 0) {
      this.logger.info('No organizations found.')
      return
    }

    this.logger.info('Listing all organizations:')
    orgs.forEach((org) => {
      this.logger.log(`ID: ${org.id} | Name: ${org.companyName} | Email: ${org.email}`)
    })
  }
}