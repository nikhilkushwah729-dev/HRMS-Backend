import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuthorizationService from '#services/AuthorizationService'

export default class PermissionMiddleware {
  private authorizationService = new AuthorizationService()

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options?: { permission?: string; anyOf?: string[] }
  ) {
    const employee = ctx.auth.user
    if (!employee) {
      return ctx.response.unauthorized({ status: 'error', message: 'Authentication required' })
    }

    const requiredKeys = [options?.permission, ...(options?.anyOf || [])].filter(Boolean) as string[]
    if (!requiredKeys.length) {
      return next()
    }

    for (const permissionKey of requiredKeys) {
      const allowed = await this.authorizationService.ensurePermission(employee, permissionKey)
      if (allowed) {
        return next()
      }
    }

    return ctx.response.forbidden({
      status: 'error',
      message: 'You do not have permission to perform this action.',
      required: requiredKeys,
    })
  }
}
