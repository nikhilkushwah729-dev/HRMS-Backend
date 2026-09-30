import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SubscriptionService from '#services/SubscriptionService'

export default class SyncSubscriptionsCommand extends BaseCommand {
  static commandName = 'sync:subscriptions'
  static description = 'Sync and transition expired trial and paid subscriptions to read-only mode'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const subscriptionService = new SubscriptionService()
    this.logger.info('Starting subscription trial status sync...')
    await subscriptionService.syncTrialStatuses()
    this.logger.success('Subscription trial status sync completed.')
  }
}
