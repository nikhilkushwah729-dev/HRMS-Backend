import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'
import SubscriptionService from '#services/SubscriptionService'

export default class SeatLimitMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, response } = ctx
    
    if (!auth.user || !auth.user.orgId) {
      return next()
    }

    const subscriptionService = new SubscriptionService()
    const status = await subscriptionService.getSubscriptionStatus(auth.user.orgId)

    if (status.isExpired) {
      return response.forbidden({
        message: 'Your subscription has expired. Please upgrade to continue adding team members.',
        code: 'SUBSCRIPTION_EXPIRED'
      })
    }

    const currentCount = await subscriptionService.getMemberCount(auth.user.orgId)
    const limit = status.plan.member_limit

    if (currentCount >= limit) {
      return response.forbidden({
        message: `Plan limit reached (${limit} seats). Please upgrade your plan to add more members.`,
        code: 'SEAT_LIMIT_REACHED',
        limit,
        currentCount
      })
    }

    return next()
  }
}
