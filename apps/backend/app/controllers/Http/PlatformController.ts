import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

type CountRow = { org_id?: number; orgId?: number; total?: number; count?: number }

export default class PlatformController {
  private numberValue(value: unknown): number {
    const parsed = Number(value ?? 0)
    return Number.isFinite(parsed) ? parsed : 0
  }

  private normalizeStatus(value: unknown): string {
    return String(value || 'inactive').trim().toLowerCase() || 'inactive'
  }

  private async safeQuery<T>(factory: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await factory()
    } catch {
      return fallback
    }
  }

  async overview({ auth, response }: HttpContext) {
    const employee = auth.user!
    const roleId = Number(employee.roleId ?? 0)
    const isPlatformScope = roleId === 1

    if (![1, 2, 3].includes(roleId)) {
      return response.forbidden({ status: 'error', message: 'Platform overview is available only for platform and organization admins.' })
    }

    const organizationsQuery = db
      .from('organizations')
      .select('id', 'company_name', 'email', 'is_active', 'subscription_status', 'created_at')
      .orderBy('id', 'desc')

    if (!isPlatformScope) {
      organizationsQuery.where('id', employee.orgId)
    }

    const organizations = await this.safeQuery(() => organizationsQuery, [])
    const orgIds = organizations.map((org: any) => Number(org.id)).filter(Boolean)

    const employeeCounts = await this.safeQuery(async () => {
      if (!orgIds.length) return [] as CountRow[]
      return db
        .from('employees')
        .select('org_id')
        .count('* as total')
        .whereIn('org_id', orgIds)
        .where('status', 'active')
        .groupBy('org_id')
    }, [] as CountRow[])

    const addonCounts = await this.safeQuery(async () => {
      if (!orgIds.length) return [] as CountRow[]
      return db
        .from('organization_addons')
        .select('org_id')
        .count('* as total')
        .whereIn('org_id', orgIds)
        .where('is_active', true)
        .groupBy('org_id')
    }, [] as CountRow[])

    const latestSubscriptions = await this.safeQuery(async () => {
      if (!orgIds.length) return [] as any[]
      return db
        .from('subscriptions')
        .leftJoin('plans', 'plans.id', 'subscriptions.plan_id')
        .select('subscriptions.org_id', 'subscriptions.status', 'plans.name as plan_name')
        .whereIn('subscriptions.org_id', orgIds)
        .orderBy('subscriptions.created_at', 'desc')
    }, [] as any[])

    const moduleRows = await this.safeQuery(async () => {
      if (!orgIds.length) return [] as any[]
      return db
        .from('organization_addons')
        .leftJoin('addon_prices', 'addon_prices.id', 'organization_addons.addon_id')
        .select('addon_prices.slug', 'addon_prices.name')
        .countDistinct('organization_addons.org_id as active_organizations')
        .whereIn('organization_addons.org_id', orgIds)
        .where('organization_addons.is_active', true)
        .groupBy('addon_prices.slug', 'addon_prices.name')
        .orderBy('addon_prices.name', 'asc')
    }, [] as any[])

    const payments = await this.safeQuery(async () => {
      if (!orgIds.length) return [] as any[]
      return db
        .from('payments')
        .select('currency')
        .sum('amount as revenue')
        .whereIn('org_id', orgIds)
        .where('status', 'success')
        .groupBy('currency')
    }, [] as any[])

    const countByOrg = new Map<number, number>()
    employeeCounts.forEach((row: any) => countByOrg.set(Number(row.org_id ?? row.orgId), this.numberValue(row.total ?? row.count)))

    const addonsByOrg = new Map<number, number>()
    addonCounts.forEach((row: any) => addonsByOrg.set(Number(row.org_id ?? row.orgId), this.numberValue(row.total ?? row.count)))

    const subscriptionByOrg = new Map<number, any>()
    latestSubscriptions.forEach((row: any) => {
      const orgId = Number(row.org_id)
      if (!subscriptionByOrg.has(orgId)) subscriptionByOrg.set(orgId, row)
    })

    const mappedOrganizations = organizations.map((org: any) => {
      const orgId = Number(org.id)
      const subscription = subscriptionByOrg.get(orgId)
      return {
        id: orgId,
        name: org.company_name || `Organization ${orgId}`,
        email: org.email || null,
        status: org.is_active ? 'active' : 'inactive',
        subscriptionStatus: this.normalizeStatus(subscription?.status ?? org.subscription_status),
        employeeCount: countByOrg.get(orgId) ?? 0,
        activeModules: addonsByOrg.get(orgId) ?? 0,
        planName: subscription?.plan_name || 'No plan',
        createdAt: org.created_at ?? null,
      }
    })

    const statusCounts = mappedOrganizations.reduce(
      (acc, org) => {
        const status = this.normalizeStatus(org.subscriptionStatus)
        if (status.includes('trial')) acc.trial += 1
        else if (status.includes('active')) acc.active += 1
        else if (status.includes('expired') || status.includes('grace')) acc.expired += 1
        return acc
      },
      { active: 0, trial: 0, expired: 0 }
    )

    const primaryPayment = payments[0]
    const revenue = payments.reduce((sum: number, row: any) => sum + this.numberValue(row.revenue), 0)

    return response.ok({
      status: 'success',
      data: {
        scope: isPlatformScope ? 'platform' : 'organization',
        totals: {
          organizations: mappedOrganizations.length,
          activeUsers: mappedOrganizations.reduce((sum, org) => sum + org.employeeCount, 0),
          modulesEnabled: mappedOrganizations.reduce((sum, org) => sum + org.activeModules, 0),
          subscriptions: statusCounts.active + statusCounts.trial,
        },
        organizations: mappedOrganizations,
        modules: moduleRows.map((module: any) => ({
          slug: module.slug || 'module',
          name: module.name || module.slug || 'Module',
          activeOrganizations: this.numberValue(module.active_organizations),
          totalOrganizations: mappedOrganizations.length,
        })),
        subscription: {
          ...statusCounts,
          revenue,
          currency: primaryPayment?.currency || 'INR',
        },
      },
    })
  }
}
