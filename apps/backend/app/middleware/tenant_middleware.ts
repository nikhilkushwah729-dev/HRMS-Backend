import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Role from '#models/role'
import Organization from '#models/organization'

export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    // If no user is authenticated, reject immediately as this middleware must run after auth
    if (!user) {
      return ctx.response.unauthorized({
        status: 'error',
        message: 'Authentication required to access organization resources.',
      })
    }

    // Explicitly verify legitimate platform Super Admin (system Super Admin with global scope)
    const isSuperAdmin = await this.isVerifiedSuperAdmin(user)
    if (isSuperAdmin) {
      return await next()
    }

    // Ordinary tenant users must have a positive integer org_id
    const orgId = Number(user.orgId ?? 0)
    if (!Number.isInteger(orgId) || orgId <= 0) {
      return ctx.response.forbidden({
        status: 'error',
        message: 'Account check failed: No organization assigned for this profile.',
      })
    }

    // Verify that the organization exists and is active in the database
    const org = await Organization.find(orgId)
    if (!org) {
      return ctx.response.notFound({
        status: 'error',
        message: 'Organization not found.',
      })
    }

    if (!org.isActive || org.subscriptionStatus === 'suspended') {
      return ctx.response.forbidden({
        status: 'error',
        message: 'Organization account is inactive or suspended. Please contact support.',
      })
    }

    // Attach validated tenant context to HttpContext
    ;(ctx as any).tenantOrg = org
    ;(ctx as any).tenantOrgId = orgId

    await next()
  }

  private async isVerifiedSuperAdmin(user: any): Promise<boolean> {
    const roleId = Number(user.roleId ?? 0)
    if (roleId <= 0) return false

    try {
      const role = await Role.find(roleId)
      if (!role) return false

      const normalizedName = String(role.roleName || '').trim().toLowerCase()
      return normalizedName === 'super admin' && (role.orgId === null || Boolean(role.isSystem))
    } catch {
      return false
    }
  }
}
