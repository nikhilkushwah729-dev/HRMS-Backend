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

  private async isVerifiedSuperAdmin(user: any): Promise<boolean> {
    if (!user) return false
    const roleId = Number(user.roleId ?? 0)
    if (roleId <= 0) return false

    try {
      const Role = (await import('#models/role')).default
      const role = await Role.find(roleId)
      if (!role) return false

      const normalizedName = String(role.roleName || '').trim().toLowerCase()
      return normalizedName === 'super admin' && (role.orgId === null || Boolean(role.isSystem))
    } catch {
      return false
    }
  }

  async createOrganization({ request, response, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const payload = request.only(['companyName', 'email', 'userLimit', 'subscriptionStatus', 'phone', 'city', 'state'])
    if (!payload.companyName) {
      return response.badRequest({ status: 'error', message: 'Organization name is required.' })
    }

    const Organization = (await import('#models/organization')).default
    const SubscriptionService = (await import('#services/SubscriptionService')).default
    const subService = new SubscriptionService()

    const org = await Organization.create({
      companyName: payload.companyName,
      email: payload.email || null,
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

  async updateOrganization(ctx: HttpContext) {
    const { request, response, params, auth } = ctx
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const Organization = (await import('#models/organization')).default
    const org = await Organization.find(params.id)
    if (!org) {
      return response.notFound({ status: 'error', message: 'Organization not found.' })
    }

    const oldValues = {
      companyName: org.companyName,
      email: org.email,
      userLimit: org.userLimit,
      subscriptionStatus: org.subscriptionStatus,
      readOnlyMode: org.readOnlyMode,
    }

    const payload = request.only(['companyName', 'email', 'userLimit', 'subscriptionStatus', 'phone', 'city', 'state', 'isActive', 'readOnlyMode'])
    if (payload.companyName !== undefined) org.companyName = payload.companyName
    if (payload.email !== undefined) org.email = payload.email
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

    const user = auth.user
    if (user) {
      try {
        const AuditLogService = (await import('#services/AuditLogService')).default
        const GeoService = (await import('#services/GeoService')).default
        const auditLogService = new AuditLogService(new GeoService())
        await auditLogService.log({
          orgId: org.id,
          employeeId: user.id,
          action: 'UPDATE_ORGANIZATION_SETTINGS',
          module: 'Platform',
          entityName: 'Organization',
          entityId: org.id,
          oldValues,
          newValues: payload,
          ctx,
        })
      } catch {
        // Suppress audit log failures to ensure primary update flow succeeds
      }
    }

    return response.ok({ status: 'success', data: org })
  }

  async deleteOrganization({ response, params, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }
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

  async getOrganizationAddons({ response, params, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }
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

  async updateOrganizationAddons(ctx: HttpContext) {
    const { request, response, params, auth } = ctx
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }
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

    const user = auth.user
    if (user) {
      try {
        const AuditLogService = (await import('#services/AuditLogService')).default
        const GeoService = (await import('#services/GeoService')).default
        const auditLogService = new AuditLogService(new GeoService())
        await auditLogService.log({
          orgId,
          employeeId: user.id,
          action: 'UPDATE_ORGANIZATION_ADDONS',
          module: 'Platform',
          entityName: 'OrganizationAddon',
          entityId: orgId,
          newValues: addons,
          ctx,
        })
      } catch {
        // Suppress audit log failures to ensure primary update flow succeeds
      }
    }

    return response.ok({ status: 'success', message: 'Organization module permissions updated successfully.' })
  }

  async getOrganizationUsers({ response, params, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }
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
        'roles.role_name as role_name'
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

  async resetUserPassword({ request, response, params, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }
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

  private readonly validModules = new Set([
    'ess',
    'attendance',
    'leaves',
    'leave',
    'payroll',
    'visits',
    'visitmanagement',
    'visitormanagement',
    'expenses',
    'expense',
    'timesheets',
    'timesheet',
    'auditlogs',
    'assets',
    'performance',
    'announcements',
    'projects',
    'kiosk',
    'geofence',
    'facerecognition',
    'shiftplanner',
    'employeetracking',
    'tracking',
  ])

  private readonly attendanceDependentModules = new Set([
    'facerecognition',
    'geofence',
    'shiftplanner',
    'kiosk',
  ])

  private validateModules(modules: unknown): { isValid: boolean; error?: string; normalized: string[] } {
    if (!Array.isArray(modules)) {
      return { isValid: false, error: 'Modules must be an array of module names.', normalized: [] }
    }

    const normalizedList: string[] = []
    const normalizedSet = new Set<string>()

    for (const m of modules) {
      if (typeof m !== 'string' || !m.trim()) {
        return { isValid: false, error: 'Module names must be non-empty strings.', normalized: [] }
      }
      const raw = m.trim()
      const norm = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!this.validModules.has(norm)) {
        return {
          isValid: false,
          error: `Invalid or unsupported module: '${raw}'.`,
          normalized: [],
        }
      }
      normalizedSet.add(norm)
      normalizedList.push(raw)
    }

    const hasAttendance = normalizedSet.has('attendance')
    const missingPrereqs: string[] = []
    for (const mod of normalizedSet) {
      if (this.attendanceDependentModules.has(mod) && !hasAttendance) {
        missingPrereqs.push(mod)
      }
    }

    if (missingPrereqs.length > 0) {
      return {
        isValid: false,
        error: `Modules [${missingPrereqs.join(', ')}] require Attendance Core to be included in the plan.`,
        normalized: [],
      }
    }

    return { isValid: true, normalized: normalizedList }
  }

  private async logAudit(
    ctx: HttpContext,
    params: {
      action: string
      entityName: string
      entityId: string | number
      oldValues?: any
      newValues?: any
    }
  ) {
    const user = ctx.auth?.user
    if (!user) return

    try {
      const AuditLogService = (await import('#services/AuditLogService')).default
      const GeoService = (await import('#services/GeoService')).default
      const auditLogService = new AuditLogService(new GeoService())
      await auditLogService.log({
        orgId: user.orgId ?? undefined,
        employeeId: user.id,
        action: params.action,
        module: 'Platform',
        entityName: params.entityName,
        entityId: String(params.entityId),
        oldValues: params.oldValues,
        newValues: params.newValues,
        ctx,
      })
    } catch {
      // Suppress audit log failures to ensure primary mutation succeeds
    }
  }

  async getPlans({ response, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const Plan = (await import('#models/plan')).default
    const FeatureLimit = (await import('#models/feature_limit')).default

    const plans = await Plan.query().orderBy('sortOrder', 'asc').orderBy('id', 'asc')
    const planIds = plans.map((p) => p.id)

    const limits = planIds.length > 0
      ? await FeatureLimit.query().whereIn('planId', planIds).orderBy('id', 'asc')
      : []

    const limitsByPlan = new Map<number, any[]>()
    for (const limit of limits) {
      if (!limitsByPlan.has(limit.planId)) {
        limitsByPlan.set(limit.planId, [])
      }
      limitsByPlan.get(limit.planId)!.push({
        id: limit.id,
        featureKey: limit.featureKey,
        featureLabel: limit.featureLabel,
        featureType: limit.featureType,
        isEnabled: Boolean(limit.isEnabled),
        limitValue: limit.limitValue,
        metadata: limit.metadata,
      })
    }

    const subCounts = planIds.length > 0
      ? await db
          .from('subscriptions')
          .whereIn('plan_id', planIds)
          .where('status', 'active')
          .groupBy('plan_id')
          .select('plan_id')
          .count('* as count')
      : []

    const subCountByPlan = new Map<number, number>()
    for (const row of subCounts as any[]) {
      subCountByPlan.set(Number(row.plan_id), Number(row.count ?? 0))
    }

    const data = plans.map((plan) => {
      let modules = []
      try {
        modules = typeof plan.modules === 'string' ? JSON.parse(plan.modules) : (plan.modules ?? [])
      } catch {
        modules = []
      }

      let features = {}
      try {
        features = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features ?? {})
      } catch {
        features = {}
      }

      return {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: Number(plan.price ?? 0),
        monthlyPrice: Number(plan.monthlyPrice ?? 0),
        yearlyPrice: Number(plan.yearlyPrice ?? 0),
        currency: plan.currency || 'INR',
        userLimit: Number(plan.userLimit ?? 10),
        storageLimitMb: Number(plan.storageLimitMb ?? 512),
        durationDays: Number(plan.durationDays ?? 30),
        features,
        modules,
        isActive: Boolean(plan.isActive),
        isPublic: Boolean(plan.isPublic),
        isTrialPlan: Boolean(plan.isTrialPlan),
        sortOrder: Number(plan.sortOrder ?? 0),
        activeSubscriptionsCount: subCountByPlan.get(plan.id) ?? 0,
        featureLimits: limitsByPlan.get(plan.id) ?? [],
      }
    })

    return response.ok({ status: 'success', data })
  }

  async createPlan(ctx: HttpContext) {
    const { request, response, auth } = ctx
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const name = String(request.input('name') || '').trim()
    if (!name) {
      return response.badRequest({ status: 'error', message: 'Plan name is required.' })
    }

    let slug = String(request.input('slug') || '').trim().toLowerCase()
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }
    if (!/^[a-z0-9_-]+$/.test(slug)) {
      return response.badRequest({ status: 'error', message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores.' })
    }

    const Plan = (await import('#models/plan')).default
    const existing = await Plan.query().where('slug', slug).first()
    if (existing) {
      return response.badRequest({ status: 'error', message: `Plan with slug '${slug}' already exists.` })
    }

    const price = Number(request.input('price', request.input('monthlyPrice', 0)))
    const monthlyPrice = Number(request.input('monthlyPrice', price))
    const yearlyPrice = Number(request.input('yearlyPrice', monthlyPrice * 10))

    if (price < 0 || monthlyPrice < 0 || yearlyPrice < 0) {
      return response.badRequest({ status: 'error', message: 'Plan prices cannot be negative.' })
    }

    const userLimit = Number(request.input('userLimit', 10))
    if (!Number.isInteger(userLimit) || userLimit <= 0) {
      return response.badRequest({ status: 'error', message: 'userLimit must be a positive integer.' })
    }

    const storageLimitMb = Number(request.input('storageLimitMb', 512))
    if (!Number.isInteger(storageLimitMb) || storageLimitMb < 0) {
      return response.badRequest({ status: 'error', message: 'storageLimitMb must be a non-negative integer.' })
    }

    const durationDays = Number(request.input('durationDays', 30))
    if (!Number.isInteger(durationDays) || durationDays <= 0) {
      return response.badRequest({ status: 'error', message: 'durationDays must be a positive integer.' })
    }

    const currency = String(request.input('currency', 'INR')).trim().toUpperCase()
    if (!currency || currency.length < 2 || currency.length > 10) {
      return response.badRequest({ status: 'error', message: 'currency must be a valid currency code.' })
    }

    const rawModules = request.input('modules', ['ESS', 'Attendance', 'Leaves'])
    const moduleValidation = this.validateModules(rawModules)
    if (!moduleValidation.isValid) {
      return response.badRequest({ status: 'error', message: moduleValidation.error })
    }

    const isActive = request.input('isActive') !== undefined ? Boolean(request.input('isActive')) : true
    const isPublic = request.input('isPublic') !== undefined ? Boolean(request.input('isPublic')) : true
    const isTrialPlan = Boolean(request.input('isTrialPlan', false))
    const sortOrder = Number(request.input('sortOrder', 0))
    const features = request.input('features', {})
    const featureLimits = request.input('featureLimits', [])

    const createdPlan = await db.transaction(async (trx) => {
      const plan = new Plan()
      plan.useTransaction(trx)
      plan.name = name
      plan.slug = slug
      plan.price = price
      plan.monthlyPrice = monthlyPrice
      plan.yearlyPrice = yearlyPrice
      plan.currency = currency
      plan.userLimit = userLimit
      plan.storageLimitMb = storageLimitMb
      plan.durationDays = durationDays
      plan.modules = JSON.stringify(moduleValidation.normalized)
      plan.features = typeof features === 'object' ? JSON.stringify(features) : features
      plan.isActive = isActive
      plan.isPublic = isPublic
      plan.isTrialPlan = isTrialPlan
      plan.sortOrder = sortOrder
      await plan.save()

      if (Array.isArray(featureLimits) && featureLimits.length > 0) {
        const FeatureLimit = (await import('#models/feature_limit')).default
        for (const fl of featureLimits) {
          if (fl && fl.featureKey) {
            await FeatureLimit.create({
              planId: plan.id,
              featureKey: String(fl.featureKey).trim(),
              featureLabel: fl.featureLabel ? String(fl.featureLabel).trim() : null,
              featureType: ['boolean', 'number', 'json'].includes(fl.featureType) ? fl.featureType : 'boolean',
              isEnabled: fl.isEnabled !== undefined ? Boolean(fl.isEnabled) : true,
              limitValue: fl.limitValue !== undefined && fl.limitValue !== null ? String(fl.limitValue) : null,
              metadata: fl.metadata ?? null,
            }, { client: trx })
          }
        }
      }

      return plan
    })

    await this.logAudit(ctx, {
      action: 'CREATE_PLAN',
      entityName: 'Plan',
      entityId: createdPlan.id,
      newValues: {
        id: createdPlan.id,
        name: createdPlan.name,
        slug: createdPlan.slug,
        price: createdPlan.price,
        modules: moduleValidation.normalized,
        isActive: createdPlan.isActive,
      },
    })

    return response.created({ status: 'success', data: createdPlan })
  }

  async updatePlan(ctx: HttpContext) {
    const { request, response, params, auth } = ctx
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const planId = Number(params.id)
    if (!planId) {
      return response.badRequest({ status: 'error', message: 'Valid plan ID is required.' })
    }

    const Plan = (await import('#models/plan')).default
    const plan = await Plan.find(planId)
    if (!plan) {
      return response.notFound({ status: 'error', message: 'Plan not found.' })
    }

    const oldValues: Record<string, any> = {
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      currency: plan.currency,
      userLimit: plan.userLimit,
      storageLimitMb: plan.storageLimitMb,
      durationDays: plan.durationDays,
      modules: plan.modules,
      features: plan.features,
      isActive: plan.isActive,
      isPublic: plan.isPublic,
      isTrialPlan: plan.isTrialPlan,
      sortOrder: plan.sortOrder,
    }

    if (request.input('name') !== undefined) {
      const name = String(request.input('name')).trim()
      if (!name) {
        return response.badRequest({ status: 'error', message: 'Plan name cannot be empty.' })
      }
      plan.name = name
    }

    if (request.input('slug') !== undefined) {
      const slug = String(request.input('slug')).trim().toLowerCase()
      if (!/^[a-z0-9_-]+$/.test(slug)) {
        return response.badRequest({ status: 'error', message: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores.' })
      }
      if (slug !== plan.slug) {
        const existing = await Plan.query().where('slug', slug).whereNot('id', plan.id).first()
        if (existing) {
          return response.badRequest({ status: 'error', message: `Plan with slug '${slug}' already exists.` })
        }
        plan.slug = slug
      }
    }

    if (request.input('price') !== undefined) {
      const p = Number(request.input('price'))
      if (p < 0 || Number.isNaN(p)) return response.badRequest({ status: 'error', message: 'Plan price cannot be negative.' })
      plan.price = p
    }
    if (request.input('monthlyPrice') !== undefined) {
      const mp = Number(request.input('monthlyPrice'))
      if (mp < 0 || Number.isNaN(mp)) return response.badRequest({ status: 'error', message: 'Monthly price cannot be negative.' })
      plan.monthlyPrice = mp
    }
    if (request.input('yearlyPrice') !== undefined) {
      const yp = Number(request.input('yearlyPrice'))
      if (yp < 0 || Number.isNaN(yp)) return response.badRequest({ status: 'error', message: 'Yearly price cannot be negative.' })
      plan.yearlyPrice = yp
    }

    if (request.input('userLimit') !== undefined) {
      const ul = Number(request.input('userLimit'))
      if (!Number.isInteger(ul) || ul <= 0) return response.badRequest({ status: 'error', message: 'userLimit must be a positive integer.' })
      plan.userLimit = ul
    }
    if (request.input('storageLimitMb') !== undefined) {
      const sl = Number(request.input('storageLimitMb'))
      if (!Number.isInteger(sl) || sl < 0) return response.badRequest({ status: 'error', message: 'storageLimitMb must be a non-negative integer.' })
      plan.storageLimitMb = sl
    }
    if (request.input('durationDays') !== undefined) {
      const dd = Number(request.input('durationDays'))
      if (!Number.isInteger(dd) || dd <= 0) return response.badRequest({ status: 'error', message: 'durationDays must be a positive integer.' })
      plan.durationDays = dd
    }
    if (request.input('currency') !== undefined) {
      const c = String(request.input('currency')).trim().toUpperCase()
      if (!c || c.length < 2 || c.length > 10) return response.badRequest({ status: 'error', message: 'currency must be a valid currency code.' })
      plan.currency = c
    }

    if (request.input('modules') !== undefined) {
      const moduleValidation = this.validateModules(request.input('modules'))
      if (!moduleValidation.isValid) {
        return response.badRequest({ status: 'error', message: moduleValidation.error })
      }

      let existingModules: string[] = []
      try {
        existingModules = typeof plan.modules === 'string' ? JSON.parse(plan.modules) : (plan.modules ?? [])
      } catch {
        existingModules = []
      }

      const existingNormalized = new Set(existingModules.map((m) => m.toLowerCase().replace(/[^a-z0-9]/g, '')))
      const newNormalized = new Set(moduleValidation.normalized.map((m) => m.toLowerCase().replace(/[^a-z0-9]/g, '')))

      const removedModules = Array.from(existingNormalized).filter((m) => !newNormalized.has(m))
      if (removedModules.length > 0) {
        const activeSubs = await db
          .from('subscriptions')
          .where('plan_id', plan.id)
          .where('status', 'active')
          .count('* as count')
        const activeCount = Number((activeSubs[0] as any)?.count ?? 0)
        if (activeCount > 0) {
          return response.badRequest({
            status: 'error',
            message: `Cannot remove module(s) [${removedModules.join(', ')}] from a plan with active paid subscriptions (${activeCount} active). Removing modules would immediately revoke paid customer access. Create a new plan instead or adjust organization-specific add-ons.`,
          })
        }
      }

      plan.modules = JSON.stringify(moduleValidation.normalized)
    }

    if (request.input('isActive') !== undefined) {
      const targetIsActive = Boolean(request.input('isActive'))
      if (!targetIsActive && plan.isActive) {
        if (plan.isTrialPlan || plan.slug === 'trial') {
          const otherTrial = await Plan.query()
            .where('isTrialPlan', true)
            .whereNot('id', plan.id)
            .where('isActive', true)
            .first()
          if (!otherTrial) {
            return response.badRequest({
              status: 'error',
              message: 'Cannot deactivate the configured default trial plan. At least one active trial plan must be maintained.',
            })
          }
        }

        const activeSubs = await db
          .from('subscriptions')
          .where('plan_id', plan.id)
          .where('status', 'active')
          .count('* as count')
        const activeCount = Number((activeSubs[0] as any)?.count ?? 0)
        if (activeCount > 0) {
          return response.badRequest({
            status: 'error',
            message: `Cannot deactivate a plan with active subscriptions (${activeCount} active). Consider making it private (isPublic = false) instead.`,
          })
        }
      }
      plan.isActive = targetIsActive
    }

    if (request.input('isPublic') !== undefined) plan.isPublic = Boolean(request.input('isPublic'))
    if (request.input('isTrialPlan') !== undefined) plan.isTrialPlan = Boolean(request.input('isTrialPlan'))
    if (request.input('sortOrder') !== undefined) plan.sortOrder = Number(request.input('sortOrder'))
    if (request.input('features') !== undefined) {
      const f = request.input('features')
      plan.features = typeof f === 'object' ? JSON.stringify(f) : f
    }

    const featureLimits = request.input('featureLimits')

    await db.transaction(async (trx) => {
      plan.useTransaction(trx)
      await plan.save()

      if (Array.isArray(featureLimits)) {
        const FeatureLimit = (await import('#models/feature_limit')).default
        for (const fl of featureLimits) {
          if (fl && fl.featureKey) {
            const featureKey = String(fl.featureKey).trim()
            const existingLimit = await FeatureLimit.query({ client: trx })
              .where('planId', plan.id)
              .where('featureKey', featureKey)
              .first()

            if (existingLimit) {
              if (fl.featureLabel !== undefined) existingLimit.featureLabel = fl.featureLabel ? String(fl.featureLabel).trim() : null
              if (fl.featureType !== undefined && ['boolean', 'number', 'json'].includes(fl.featureType)) existingLimit.featureType = fl.featureType
              if (fl.isEnabled !== undefined) existingLimit.isEnabled = Boolean(fl.isEnabled)
              if (fl.limitValue !== undefined) existingLimit.limitValue = fl.limitValue !== null ? String(fl.limitValue) : null
              if (fl.metadata !== undefined) existingLimit.metadata = fl.metadata
              await existingLimit.save()
            } else {
              await FeatureLimit.create({
                planId: plan.id,
                featureKey,
                featureLabel: fl.featureLabel ? String(fl.featureLabel).trim() : null,
                featureType: ['boolean', 'number', 'json'].includes(fl.featureType) ? fl.featureType : 'boolean',
                isEnabled: fl.isEnabled !== undefined ? Boolean(fl.isEnabled) : true,
                limitValue: fl.limitValue !== undefined && fl.limitValue !== null ? String(fl.limitValue) : null,
                metadata: fl.metadata ?? null,
              }, { client: trx })
            }
          }
        }
      }
    })

    await this.logAudit(ctx, {
      action: 'UPDATE_PLAN',
      entityName: 'Plan',
      entityId: plan.id,
      oldValues,
      newValues: plan.toJSON(),
    })

    return response.ok({ status: 'success', data: plan })
  }

  async togglePlan(ctx: HttpContext) {
    const { request, response, params, auth } = ctx
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const planId = Number(params.id)
    if (!planId) {
      return response.badRequest({ status: 'error', message: 'Valid plan ID is required.' })
    }

    const Plan = (await import('#models/plan')).default
    const plan = await Plan.find(planId)
    if (!plan) {
      return response.notFound({ status: 'error', message: 'Plan not found.' })
    }

    const targetIsActive = request.input('isActive') !== undefined
      ? Boolean(request.input('isActive'))
      : !plan.isActive

    if (!targetIsActive && plan.isActive) {
      if (plan.isTrialPlan || plan.slug === 'trial') {
        const otherTrial = await Plan.query()
          .where('isTrialPlan', true)
          .whereNot('id', plan.id)
          .where('isActive', true)
          .first()
        if (!otherTrial) {
          return response.badRequest({
            status: 'error',
            message: 'Cannot deactivate the configured default trial plan. At least one active trial plan must be maintained.',
          })
        }
      }

      const activeSubs = await db
        .from('subscriptions')
        .where('plan_id', plan.id)
        .where('status', 'active')
        .count('* as count')
      const activeCount = Number((activeSubs[0] as any)?.count ?? 0)
      if (activeCount > 0) {
        return response.badRequest({
          status: 'error',
          message: `Cannot deactivate a plan with active subscriptions (${activeCount} active). Consider making it private (isPublic = false) instead.`,
        })
      }
    }

    const oldIsActive = plan.isActive
    plan.isActive = targetIsActive
    await plan.save()

    await this.logAudit(ctx, {
      action: 'TOGGLE_PLAN',
      entityName: 'Plan',
      entityId: plan.id,
      oldValues: { isActive: oldIsActive },
      newValues: { isActive: plan.isActive },
    })

    return response.ok({ status: 'success', data: plan })
  }

  async getAddons({ response, auth }: HttpContext) {
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const AddonPrice = (await import('#models/addon_price')).default
    const addons = await AddonPrice.query().orderBy('id', 'asc')

    const activeCounts = await db
      .from('organization_addons')
      .where('is_active', true)
      .groupBy('addon_id')
      .select('addon_id')
      .count('* as count')

    const countMap = new Map<number, number>()
    for (const row of activeCounts as any[]) {
      countMap.set(Number(row.addon_id), Number(row.count ?? 0))
    }

    const data = addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      slug: addon.slug,
      price: Number(addon.price ?? 0),
      planType: addon.planType,
      isActive: Boolean(addon.isActive),
      activeOrganizationsCount: countMap.get(addon.id) ?? 0,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    }))

    return response.ok({ status: 'success', data })
  }

  async updateAddon(ctx: HttpContext) {
    const { request, response, params, auth } = ctx
    if (!(await this.isVerifiedSuperAdmin(auth.user))) {
      return response.forbidden({ status: 'error', message: 'Platform Super Admin access required.' })
    }

    const addonId = Number(params.id)
    if (!addonId) {
      return response.badRequest({ status: 'error', message: 'Valid add-on ID is required.' })
    }

    const AddonPrice = (await import('#models/addon_price')).default
    const addon = await AddonPrice.find(addonId)
    if (!addon) {
      return response.notFound({ status: 'error', message: 'Add-on not found.' })
    }

    const oldValues = {
      name: addon.name,
      price: addon.price,
      isActive: addon.isActive,
    }

    if (request.input('name') !== undefined) {
      const name = String(request.input('name')).trim()
      if (!name) {
        return response.badRequest({ status: 'error', message: 'Add-on name cannot be empty.' })
      }
      addon.name = name
    }

    if (request.input('price') !== undefined) {
      const price = Number(request.input('price'))
      if (price < 0 || Number.isNaN(price)) {
        return response.badRequest({ status: 'error', message: 'Add-on price cannot be negative.' })
      }
      addon.price = price
    }

    if (request.input('isActive') !== undefined) {
      addon.isActive = Boolean(request.input('isActive'))
    }

    await addon.save()

    await this.logAudit(ctx, {
      action: 'UPDATE_ADDON',
      entityName: 'AddonPrice',
      entityId: addon.id,
      oldValues,
      newValues: {
        name: addon.name,
        price: addon.price,
        isActive: addon.isActive,
      },
    })

    return response.ok({ status: 'success', data: addon })
  }
}



