import { BaseSeeder } from '@adonisjs/lucid/seeders'
import SubscriptionService from '#services/SubscriptionService'

export default class extends BaseSeeder {
  async run() {
    const service = new SubscriptionService()
    await service.ensureCatalog()
    await service.bootstrapExistingOrganizations()
  }
}
