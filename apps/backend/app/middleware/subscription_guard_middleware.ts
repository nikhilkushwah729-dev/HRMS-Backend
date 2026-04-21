import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import SubscriptionService from '#services/SubscriptionService'

export default class SubscriptionGuardMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { module: string }) {
    const { auth, response, request } = ctx
    const user = auth.user

    if (!user) {
      return next()
    }

    const subscriptionService = new SubscriptionService()
    const result = await subscriptionService.evaluateFeatureAccess(
      user.orgId,
      options.module,
      request.method()
    )

    if (!result.allowed) {
      return response.status(403).json({
        status: 'error',
        message: result.reason,
        subscriptionStatus: result.subscriptionStatus,
        readOnly: result.readOnly,
        code: 'SUBSCRIPTION_RESTRICTED',
      })
    }

    await next()
  }
}
