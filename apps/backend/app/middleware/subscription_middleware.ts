import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import SubscriptionService from '#services/SubscriptionService'

export default class SubscriptionMiddleware {
  private subscriptionService = new SubscriptionService()

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options?: { module?: string }
  ) {
    const employee = ctx.auth.user
    if (!employee) {
      return ctx.response.unauthorized({ message: 'Authentication required' })
    }

    if (!options?.module) {
      return next()
    }

    const verdict = await this.subscriptionService.evaluateFeatureAccess(employee.orgId, options.module, ctx.request.method())
    if (!verdict.allowed) {
      return ctx.response.paymentRequired({
        status: 'error',
        message: verdict.reason || 'Upgrade required for this feature.',
        subscriptionStatus: verdict.subscriptionStatus,
        readOnly: verdict.readOnly,
      })
    }

    return next()
  }
}
