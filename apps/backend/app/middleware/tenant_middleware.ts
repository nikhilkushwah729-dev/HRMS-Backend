import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    // If no user is authenticated, let the auth middleware handle it.
    if (!user) {
      return await next()
    }

    // Role ID 1 is global Super Admin - No tenant isolation required.
    if (Number(user.roleId) === 1) {
      return await next()
    }

    // Organization Admin, HR Manager, Manager, and Employee must have an org_id assigned.
    if (!user.orgId) {
      return ctx.response.unauthorized({
        status: 'error',
        message: 'Account check failed: No organization assigned for this profile.'
      })
    }

    // Add org_id to ctx for convenient access in controllers
    // Optional: ctx.params.orgId = user.orgId;

    await next()
  }
}
