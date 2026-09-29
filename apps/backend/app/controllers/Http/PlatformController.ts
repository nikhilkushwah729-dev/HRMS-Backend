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

  async createOrganization({ request, response }: HttpContext) {
    const payload = request.only(['companyName', 'email', 'industry', 'userLimit', 'subscriptionStatus', 'phone', 'city', 'state'])
    if (!payload.companyName) {
      return response.badRequest({ status: 'error', message: 'Organization name is required.' })
    }

    const Organization = (await import('#models/organization')).default
    const SubscriptionService = (await import('#services/SubscriptionService')).default
    const subService = new SubscriptionService()

    const org = await Organization.create({
      companyName: payload.companyName,
      email: payload.email || null,
      industry: payload.industry || 'Information Technology',
      userLimit: Number(payload.userLimit) || 10,
      subscriptionStatus: payload.subscriptionStatus || 'active',
      phone: payload.phone || null,
      city: payload.city || null,
      state: payload.state || null,
      isTrialActive: payload.subscriptionStatus === 'trialing',
      readOnlyMode: false,
    })

    try {
      await subService.assignTrialToOrganization(org.id)
    } catch {
      // Catalog initialization fallback
    }

    return response.created({ status: 'success', data: org })
  }

  async updateOrganization({ request, response, params }: HttpContext) {
    const Organization = (await import('#models/organization')).default
    const org = await Organization.find(params.id)
    if (!org) {
      return response.notFound({ status: 'error', message: 'Organization not found.' })
    }

    const payload = request.only(['companyName', 'email', 'industry', 'userLimit', 'subscriptionStatus', 'phone', 'city', 'state', 'isActive', 'readOnlyMode'])
    if (payload.companyName !== undefined) org.companyName = payload.companyName
    if (payload.email !== undefined) org.email = payload.email
    if (payload.industry !== undefined) org.industry = payload.industry
    if (payload.userLimit !== undefined) org.userLimit = Number(payload.userLimit) || org.userLimit
    if (payload.subscriptionStatus !== undefined) {
      org.subscriptionStatus = payload.subscriptionStatus
      org.isTrialActive = payload.subscriptionStatus === 'trialing'
    }
    if (payload.phone !== undefined) org.phone = payload.phone
    if (payload.city !== undefined) org.city = payload.city
    if (payload.state !== undefined) org.state = payload.state
    if (payload.readOnlyMode !== undefined) org.readOnlyMode = Boolean(payload.readOnlyMode)

    await org.save()
    return response.ok({ status: 'success', data: org })
  }

  async deleteOrganization({ response, params }: HttpContext) {
    const Organization = (await import('#models/organization')).default
    const org = await Organization.find(params.id)
    if (!org) {
      return response.notFound({ status: 'error', message: 'Organization not found.' })
    }

    const orgId = org.id
    try {
      await db.from('organization_addons').where('org_id', orgId).delete()
      await db.from('subscriptions').where('org_id', orgId).delete()
      await db.from('payments').where('org_id', orgId).delete()
      await db.from('employees').where('org_id', orgId).delete()
    } catch {
      // Ignore cascading deletion errors
    }

    await org.delete()
    return response.ok({ status: 'success', message: `Organization #${orgId} deleted successfully.` })
  }

  async getOrganizationAddons({ response, params }: HttpContext) {
    const orgId = Number(params.id)
    const allAddons = await db.from('addon_prices').where('is_active', true).select('id', 'name', 'slug', 'price')
    const orgAddons = await db.from('organization_addons').where('org_id', orgId)

    const enabledMap = new Map<number, boolean>()
    orgAddons.forEach((row: any) => enabledMap.set(Number(row.addon_id), Boolean(row.is_active)))

    const mapped = allAddons.map((addon: any) => ({
      id: Number(addon.id),
      name: addon.name,
      slug: addon.slug,
      price: Number(addon.price || 0),
      enabled: enabledMap.get(Number(addon.id)) ?? true,
    }))

    return response.ok({ status: 'success', data: mapped })
  }

  async updateOrganizationAddons({ request, response, params }: HttpContext) {
    const orgId = Number(params.id)
    const addons = request.input('addons', []) as Array<{ id: number; enabled: boolean }>

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    for (const item of addons) {
      const addonId = Number(item.id)
      const isEnabled = Boolean(item.enabled)
      const existing = await db.from('organization_addons').where('org_id', orgId).where('addon_id', addonId).first()

      if (existing) {
        await db.from('organization_addons').where('id', existing.id).update({
          is_active: isEnabled,
          updated_at: now,
        })
      } else {
        await db.table('organization_addons').insert({
          org_id: orgId,
          addon_id: addonId,
          is_active: isEnabled,
          start_date: now.slice(0, 10),
        })
      }
    }

    return response.ok({ status: 'success', message: 'Organization module permissions updated successfully.' })
  }

  async getOrganizationUsers({ response, params }: HttpContext) {
    const orgId = Number(params.id)
    const employees = await db
      .from('employees')
      .leftJoin('roles', 'roles.id', 'employees.role_id')
      .select(
        'employees.id',
        'employees.first_name',
        'employees.last_name',
        'employees.email',
        'employees.phone',
        'employees.employee_code',
        'employees.status',
        'employees.role_id',
        'roles.name as role_name'
      )
      .where('employees.org_id', orgId)
      .orderBy('employees.id', 'asc')

    const mapped = employees.map((emp: any) => ({
      id: Number(emp.id),
      firstName: emp.first_name || '',
      lastName: emp.last_name || '',
      fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      email: emp.email || '',
      phone: emp.phone || '',
      employeeCode: emp.employee_code || '',
      roleName: emp.role_name || (emp.role_id === 1 ? 'Super Admin' : emp.role_id === 2 ? 'Admin' : 'Employee'),
      status: emp.status || 'active',
    }))

    return response.ok({ status: 'success', data: mapped })
  }

  async resetUserPassword({ request, response, params }: HttpContext) {
    const userId = Number(params.userId)
    const newPassword = request.input('password')
    if (!newPassword || newPassword.length < 6) {
      return response.badRequest({ status: 'error', message: 'New password must be at least 6 characters.' })
    }

    const Employee = (await import('#models/employee')).default
    const employee = await Employee.find(userId)
    if (!employee) {
      return response.notFound({ status: 'error', message: 'Employee user not found.' })
    }

    employee.passwordHash = newPassword
    await employee.save()

    return response.ok({ status: 'success', message: `Password for ${employee.email} updated successfully.` })
  }
}


