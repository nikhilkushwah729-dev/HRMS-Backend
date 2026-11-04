import AuditLog from '#models/audit_log'
import { HttpContext } from '@adonisjs/core/http'
import GeoService from '#services/GeoService'
import { inject } from '@adonisjs/core'

export const SENSITIVE_FIELDS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'kiosk_pin_hash',
  'kioskpinhash',
  'kiosk_pin',
  'kioskpin',
  'pin',
  'token',
  'jwt',
  'access_token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'session_token',
  'sessiontoken',
  'remember_me_token',
  'remembermetoken',
  'secret',
  'api_key',
  'apikey',
  'razorpay_key_secret',
  'razorpaykeysecret',
  'signature',
  'pan_number',
  'pannumber',
  'aadhar_number',
  'aadharnumber',
  'bank_account',
  'bankaccount',
  'ifsc_code',
  'ifsccode',
  'otp',
  'otp_code',
  'otpcode',
])

/**
 * Strips or redacts passwords, tokens, PAN, Aadhaar, bank accounts, and sensitive credentials
 */
export function sanitizeAuditData(data: any): any {
  if (!data) return null
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAuditData(item))
  }

  const sanitized: Record<string, any> = {}
  for (const [key, val] of Object.entries(data)) {
    const keyLower = key.toLowerCase()
    if (
      SENSITIVE_FIELDS.has(key) ||
      SENSITIVE_FIELDS.has(keyLower) ||
      keyLower.includes('password') ||
      keyLower.includes('token') ||
      keyLower.includes('secret') ||
      keyLower.includes('pan_number') ||
      keyLower.includes('pannumber') ||
      keyLower.includes('bank_account') ||
      keyLower.includes('bankaccount') ||
      keyLower.includes('aadhar') ||
      keyLower.includes('pin_hash')
    ) {
      sanitized[key] = '[REDACTED]'
    } else if (val && typeof val === 'object') {
      sanitized[key] = sanitizeAuditData(val)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

/**
 * Extracts ONLY fields that changed between old and new state, and sanitizes them
 */
export function extractChangedFields(
  oldValues: Record<string, any> | null,
  newValues: Record<string, any> | null
) {
  if (!oldValues && !newValues) {
    return { oldDiff: null, newDiff: null }
  }
  if (!oldValues) {
    return { oldDiff: null, newDiff: sanitizeAuditData(newValues) }
  }
  if (!newValues) {
    return { oldDiff: sanitizeAuditData(oldValues), newDiff: null }
  }

  const oldDiff: Record<string, any> = {}
  const newDiff: Record<string, any> = {}

  const ignoredKeys = new Set([
    'updated_at',
    'updatedAt',
    'created_at',
    'createdAt',
    '$dirty',
    '$original',
    '$extras',
    '$attributes',
    '$options',
  ])

  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)])
  for (const key of allKeys) {
    if (ignoredKeys.has(key)) continue

    const oldVal = oldValues[key]
    const newVal = newValues[key]

    // Compare serialized representations
    const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal)
    if (isDifferent) {
      oldDiff[key] = oldVal !== undefined ? oldVal : null
      newDiff[key] = newVal !== undefined ? newVal : null
    }
  }

  return {
    oldDiff: Object.keys(oldDiff).length > 0 ? sanitizeAuditData(oldDiff) : null,
    newDiff: Object.keys(newDiff).length > 0 ? sanitizeAuditData(newDiff) : null,
  }
}

/**
 * Extract client IP from HttpContext safely
 */
function getClientIp(ctx: HttpContext): string | null {
  const request = ctx.request
  const forwardedFor = request.header('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim())
    if (ips.length > 0 && ips[0]) {
      return ips[0]
    }
  }
  const realIp = request.header('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return request.ip()
}

@inject()
export default class AuditLogService {
  constructor(protected geoService: GeoService) {}

  /**
   * Core server-side audit logging method
   */
  async log(params: {
    orgId?: number | null
    userId?: number | null
    employeeId?: number | null
    action: string
    module: string
    entityType?: string | null
    entityName?: string | null
    entityId?: string | number | null
    description?: string | null
    oldValues?: any
    newValues?: any
    ipAddress?: string | null
    userAgent?: string | null
    requestMethod?: string | null
    requestUrl?: string | null
    status?: string
    ctx?: HttpContext
  }): Promise<AuditLog | null> {
    const {
      orgId = null,
      userId = null,
      employeeId = null,
      action,
      module,
      entityType = null,
      entityName = null,
      entityId = null,
      description = null,
      oldValues = null,
      newValues = null,
      requestMethod = null,
      requestUrl = null,
      status = 'success',
      ctx,
    } = params

    let ipAddress: string | null = params.ipAddress ?? null
    let userAgent: string | null = params.userAgent ?? null
    let reqMethod = requestMethod
    let reqUrl = requestUrl

    if (ctx) {
      ipAddress = getClientIp(ctx)
      userAgent = ctx.request.header('user-agent') ?? null
      reqMethod = ctx.request.method()
      reqUrl = ctx.request.url()
    }

    let countryCode = null
    let countryName = null
    let regionName = null
    let cityName = null
    let latitude = null
    let longitude = null

    if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      try {
        const geoInfo = await this.geoService.getLocationFromIp(ipAddress)
        if (geoInfo) {
          countryCode = geoInfo.countryCode
          countryName = geoInfo.countryName
          regionName = geoInfo.regionName
          cityName = geoInfo.cityName
          latitude = geoInfo.lat
          longitude = geoInfo.lng
        }
      } catch (_) {}
    }

    // Sanitize any raw objects
    const sanitizedOld = sanitizeAuditData(oldValues)
    const sanitizedNew = sanitizeAuditData(newValues)

    const finalUserId = userId ?? employeeId
    const finalEntityType = entityType ?? entityName

    try {
      return await AuditLog.create({
        orgId,
        userId: finalUserId,
        employeeId: finalUserId,
        action: action.toUpperCase(),
        module: module.toUpperCase(),
        entityType: finalEntityType,
        entityName: finalEntityType,
        entityId: entityId !== null && entityId !== undefined ? String(entityId) : null,
        description,
        oldValues: sanitizedOld,
        newValues: sanitizedNew,
        ipAddress,
        userAgent,
        requestMethod: reqMethod,
        requestUrl: reqUrl,
        status: status || 'success',
        countryCode,
        countryName,
        regionName,
        cityName,
        latitude,
        longitude,
        isImmutable: true,
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      return null
    }
  }

  /**
   * Reusable: log entity creation
   */
  async logCreate(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    entityType: string
    entityId: string | number
    newValues?: any
    description?: string
    ctx?: HttpContext
    status?: 'success' | 'failure'
  }) {
    return this.log({
      ...params,
      action: 'CREATE',
      oldValues: null,
      newValues: params.newValues,
      description: params.description || `Created ${params.entityType} #${params.entityId}`,
    })
  }

  /**
   * Reusable: log entity update (stores only changed fields, sanitized)
   */
  async logUpdate(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    entityType: string
    entityId: string | number
    oldValues?: any
    newValues?: any
    description?: string
    ctx?: HttpContext
    status?: 'success' | 'failure'
  }) {
    const { oldDiff, newDiff } = extractChangedFields(params.oldValues, params.newValues)
    return this.log({
      ...params,
      action: 'UPDATE',
      oldValues: oldDiff,
      newValues: newDiff,
      description: params.description || `Updated ${params.entityType} #${params.entityId}`,
    })
  }

  /**
   * Reusable: log entity deletion
   */
  async logDelete(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    entityType: string
    entityId: string | number
    oldValues?: any
    description?: string
    ctx?: HttpContext
    status?: 'success' | 'failure'
  }) {
    return this.log({
      ...params,
      action: 'DELETE',
      oldValues: params.oldValues,
      newValues: null,
      description: params.description || `Deleted ${params.entityType} #${params.entityId}`,
    })
  }

  /**
   * Reusable: log user login
   */
  async logLogin(params: {
    orgId?: number | null
    userId?: number | null
    status: 'success' | 'failure'
    description?: string
    ctx?: HttpContext
    ipAddress?: string | null
    userAgent?: string | null
  }) {
    return this.log({
      orgId: params.orgId,
      userId: params.userId,
      action: params.status === 'success' ? 'LOGIN' : 'LOGIN_FAILED',
      module: 'AUTH',
      entityType: 'Employee',
      entityId: params.userId,
      status: params.status,
      description: params.description || (params.status === 'success' ? 'User logged in successfully' : 'Failed login attempt'),
      ctx: params.ctx,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
  }

  /**
   * Reusable: log user logout
   */
  async logLogout(params: {
    orgId?: number | null
    userId?: number | null
    description?: string
    ctx?: HttpContext
    ipAddress?: string | null
    userAgent?: string | null
  }) {
    return this.log({
      orgId: params.orgId,
      userId: params.userId,
      action: 'LOGOUT',
      module: 'AUTH',
      entityType: 'Employee',
      entityId: params.userId,
      status: 'success',
      description: params.description || 'User logged out',
      ctx: params.ctx,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    })
  }

  /**
   * Reusable: log approval action
   */
  async logApproval(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    entityType: string
    entityId: string | number
    oldValues?: any
    newValues?: any
    description?: string
    ctx?: HttpContext
  }) {
    return this.log({
      ...params,
      action: 'APPROVE',
      description: params.description || `Approved ${params.entityType} #${params.entityId}`,
    })
  }

  /**
   * Reusable: log rejection action
   */
  async logRejection(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    entityType: string
    entityId: string | number
    oldValues?: any
    newValues?: any
    description?: string
    ctx?: HttpContext
  }) {
    return this.log({
      ...params,
      action: 'REJECT',
      description: params.description || `Rejected ${params.entityType} #${params.entityId}`,
    })
  }

  /**
   * Reusable: log export action
   */
  async logExport(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    description?: string
    ctx?: HttpContext
  }) {
    return this.log({
      orgId: params.orgId,
      userId: params.userId,
      action: 'EXPORT',
      module: params.module,
      entityType: params.module,
      description: params.description || `Exported ${params.module} data`,
      ctx: params.ctx,
    })
  }

  /**
   * Reusable: log import action
   */
  async logImport(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    description?: string
    ctx?: HttpContext
  }) {
    return this.log({
      orgId: params.orgId,
      userId: params.userId,
      action: 'IMPORT',
      module: params.module,
      entityType: params.module,
      description: params.description || `Imported ${params.module} data`,
      ctx: params.ctx,
    })
  }

  /**
   * Reusable: log role or permission change
   */
  async logRoleOrPermissionChange(params: {
    orgId?: number | null
    userId?: number | null
    action?: 'ROLE_CHANGE' | 'PERMISSION_CHANGE'
    entityId: string | number
    oldValues?: any
    newValues?: any
    description?: string
    ctx?: HttpContext
  }) {
    return this.log({
      orgId: params.orgId,
      userId: params.userId,
      action: params.action || 'ROLE_CHANGE',
      module: 'ROLE_PERMISSION',
      entityType: 'RolePermission',
      entityId: params.entityId,
      oldValues: params.oldValues,
      newValues: params.newValues,
      description: params.description || `Modified role / permissions for record #${params.entityId}`,
      ctx: params.ctx,
    })
  }

  /**
   * Reusable: log status change
   */
  async logStatusChange(params: {
    orgId?: number | null
    userId?: number | null
    module: string
    entityType: string
    entityId: string | number
    oldStatus: string
    newStatus: string
    description?: string
    ctx?: HttpContext
  }) {
    return this.log({
      orgId: params.orgId,
      userId: params.userId,
      action: 'STATUS_CHANGE',
      module: params.module,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: { status: params.oldStatus },
      newValues: { status: params.newStatus },
      description:
        params.description ||
        `Status of ${params.entityType} #${params.entityId} changed from ${params.oldStatus} to ${params.newStatus}`,
      ctx: params.ctx,
    })
  }

  /**
   * Get audit logs with advanced filtering, pagination, sorting, and search
   */
  async getLogs(params: {
    orgId: number | null
    module?: string
    action?: string
    userId?: number
    employeeId?: number
    startDate?: string | Date
    endDate?: string | Date
    status?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) {
    const {
      orgId,
      module,
      action,
      userId,
      employeeId,
      startDate,
      endDate,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = params

    let query = AuditLog.query().preload('employee')

    // Tenant isolation: if orgId is provided, restrict strictly
    if (orgId !== null && orgId !== undefined) {
      query = query.where('orgId', orgId)
    }

    if (module) {
      query = query.whereLike('module', `%${module}%`)
    }

    if (action) {
      query = query.whereLike('action', `%${action}%`)
    }

    const targetUser = userId ?? employeeId
    if (targetUser) {
      query = query.where((q) => {
        q.where('userId', targetUser).orWhere('employeeId', targetUser)
      })
    }

    if (status) {
      query = query.whereLike('status', `%${status}%`)
    }

    if (startDate) {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate
      query = query.where('createdAt', '>=', start)
    }

    if (endDate) {
      const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate)
      end.setHours(23, 59, 59, 999)
      query = query.where('createdAt', '<=', end)
    }

    if (search) {
      const term = `%${search.trim()}%`
      query = query.where((builder) => {
        builder
          .whereLike('description', term)
          .orWhereLike('action', term)
          .orWhereLike('module', term)
          .orWhereLike('entityType', term)
          .orWhereLike('entityName', term)
          .orWhereLike('entityId', term)
          .orWhereLike('ipAddress', term)
          .orWhereHas('employee', (empQuery) => {
            empQuery
              .whereLike('firstName', term)
              .orWhereLike('lastName', term)
              .orWhereLike('email', term)
          })
      })
    }

    const allowedSortFields: Record<string, string> = {
      id: 'id',
      created_at: 'created_at',
      createdAt: 'created_at',
      action: 'action',
      module: 'module',
      status: 'status',
    }

    const sortColumn = allowedSortFields[sortBy] || 'created_at'
    query = query.orderBy(sortColumn, sortOrder === 'asc' ? 'asc' : 'desc')

    const paginatedResults = await query.paginate(page, limit)

    return {
      data: paginatedResults.all(),
      meta: {
        total: paginatedResults.total,
        perPage: paginatedResults.perPage,
        currentPage: paginatedResults.currentPage,
        lastPage: paginatedResults.lastPage,
        firstPage: paginatedResults.firstPage,
        hasMorePages: paginatedResults.hasMorePages,
      },
    }
  }

  /**
   * Get single audit log by ID with tenant isolation
   */
  async getLogById(id: number, orgId: number | null) {
    let query = AuditLog.query().where('id', id).preload('employee')
    if (orgId !== null && orgId !== undefined) {
      query = query.where('orgId', orgId)
    }
    return await query.first()
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(orgId: number | null) {
    const baseQuery = () => {
      const q = AuditLog.query()
      if (orgId !== null && orgId !== undefined) {
        return q.where('orgId', orgId)
      }
      return q
    }

    const totalActivities = await baseQuery().count('* as total')
    const createActions = await baseQuery().where('action', 'CREATE').count('* as total')
    const updateActions = await baseQuery()
      .whereIn('action', ['UPDATE', 'ROLE_CHANGE', 'PERMISSION_CHANGE', 'STATUS_CHANGE'])
      .count('* as total')
    const deleteActions = await baseQuery().where('action', 'DELETE').count('* as total')
    const loginActivities = await baseQuery()
      .whereIn('action', ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'])
      .count('* as total')

    return {
      totalActivities: Number((totalActivities[0] as any)?.$extras?.total || 0),
      createActions: Number((createActions[0] as any)?.$extras?.total || 0),
      updateActions: Number((updateActions[0] as any)?.$extras?.total || 0),
      deleteActions: Number((deleteActions[0] as any)?.$extras?.total || 0),
      loginActivities: Number((loginActivities[0] as any)?.$extras?.total || 0),
    }
  }

  /**
   * Get distinct modules for tenant
   */
  async getModules(orgId: number | null) {
    let query = AuditLog.query().select('module').distinct().orderBy('module', 'asc')
    if (orgId !== null && orgId !== undefined) {
      query = query.where('orgId', orgId)
    }
    const results = await query
    return results.map((r) => r.module).filter(Boolean)
  }

  /**
   * Get distinct actions for tenant
   */
  async getActions(orgId: number | null) {
    let query = AuditLog.query().select('action').distinct().orderBy('action', 'asc')
    if (orgId !== null && orgId !== undefined) {
      query = query.where('orgId', orgId)
    }
    const results = await query
    return results.map((r) => r.action).filter(Boolean)
  }

  /**
   * Export audit logs to CSV
   */
  async exportLogs(params: {
    orgId: number | null
    module?: string
    action?: string
    userId?: number
    employeeId?: number
    startDate?: string | Date
    endDate?: string | Date
    status?: string
    search?: string
  }) {
    const logs = await this.getLogs({
      ...params,
      page: 1,
      limit: 5000,
    })

    const headers = [
      'ID',
      'Date & Time',
      'User',
      'Email',
      'Action',
      'Module',
      'Entity Type',
      'Entity ID',
      'Description',
      'Status',
      'IP Address',
      'Country',
      'User Agent',
    ]

    const rows = logs.data.map((log) => [
      log.id,
      log.createdAt?.toISO() || '',
      log.employee ? `${log.employee.firstName} ${log.employee.lastName || ''}`.trim() : 'System',
      log.employee?.email || '',
      log.action,
      log.module,
      log.entityType || log.entityName || '',
      log.entityId || '',
      log.description || '',
      log.status || 'success',
      log.ipAddress || '',
      log.countryName || log.countryCode || '',
      log.userAgent || '',
    ])

    return {
      headers,
      rows,
      total: logs.meta.total,
    }
  }
}
