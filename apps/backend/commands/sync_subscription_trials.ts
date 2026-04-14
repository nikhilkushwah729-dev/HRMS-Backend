import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SubscriptionService from '#services/SubscriptionService'

export default class SyncSubscriptionTrials extends BaseCommand {
  static commandName = 'subscriptions:sync'
  static description = 'Sync subscription trial expiry, notifications, and grace periods'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const service = new SubscriptionService()
    await service.syncTrialStatuses()
    this.logger.success('Subscription statuses synchronized successfully.')
  }
}
