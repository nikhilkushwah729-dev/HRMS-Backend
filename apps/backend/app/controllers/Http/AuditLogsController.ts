import { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/AuditLogService'
import { inject } from '@adonisjs/core'

@inject()
export default class AuditLogsController {
  constructor(protected auditLogService: AuditLogService) {}

  /**
   * Helper to check if user has access to audit logs and determine orgId scope
   */
  private getAuthorizedOrgId(user: any): number | null {
    const roleId = Number(user.roleId ?? 0)
    // Role 1 is Super Admin with global access (if orgId is null or global scope requested)
    if (roleId === 1 && user.orgId === null) {
      return null
    }
    return user.orgId
  }

  /**
   * Helper to verify if user has permission to view audit logs
   */
  private canAccessAuditLogs(user: any): boolean {
    const roleId = Number(user.roleId ?? 0)
    // Super Admin (1), Org Admin (2), HR Manager (3) have access
    return [1, 2, 3].includes(roleId)
  }

  /**
   * List audit logs with multi-tenant isolation, filtering, search, and pagination
   */
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!this.canAccessAuditLogs(user)) {
      return response.forbidden({
        status: 'error',
        message: 'You do not have permission to access audit logs.',
      })
    }

    const {
      module,
      action,
      user_id,
      employeeId,
      startDate,
      start_date,
      endDate,
      end_date,
      status,
      search,
      sortBy,
      sort_by,
      sortOrder,
      sort_order,
      page,
      limit,
    } = request.qs()

    const parsedPage = Math.max(1, parseInt(page, 10) || 1)
    const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 100)
    const effectiveOrgId = this.getAuthorizedOrgId(user)

    try {
      const result = await this.auditLogService.getLogs({
        orgId: effectiveOrgId,
        module: module ? String(module).trim() : undefined,
        action: action ? String(action).trim() : undefined,
        userId: user_id ? parseInt(user_id, 10) : employeeId ? parseInt(employeeId, 10) : undefined,
        startDate: startDate || start_date || undefined,
        endDate: endDate || end_date || undefined,
        status: status ? String(status).trim() : undefined,
        search: search ? String(search).trim() : undefined,
        sortBy: sortBy || sort_by || 'created_at',
        sortOrder: (sortOrder || sort_order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc',
        page: parsedPage,
        limit: parsedLimit,
      })

      return response.ok({
        status: 'success',
        data: result.data,
        meta: result.meta,
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Failed to fetch audit logs',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Get single audit log by ID with strict tenant isolation
   */
  async show({ auth, params, response }: HttpContext) {
    const user = auth.user!

    if (!this.canAccessAuditLogs(user)) {
      return response.forbidden({
        status: 'error',
        message: 'You do not have permission to access audit logs.',
      })
    }

    const id = parseInt(params.id, 10)
    if (isNaN(id) || id <= 0) {
      return response.badRequest({
        status: 'error',
        message: 'Invalid audit log ID',
      })
    }

    try {
      const effectiveOrgId = this.getAuthorizedOrgId(user)
      const log = await this.auditLogService.getLogById(id, effectiveOrgId)

      if (!log) {
        return response.notFound({
          status: 'error',
          message: 'Audit log not found',
        })
      }

      return response.ok({
        status: 'success',
        data: log,
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Failed to fetch audit log',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Get aggregated dashboard statistics
   */
  async statistics({ auth, response }: HttpContext) {
    const user = auth.user!

    if (!this.canAccessAuditLogs(user)) {
      return response.forbidden({
        status: 'error',
        message: 'You do not have permission to view audit statistics.',
      })
    }

    try {
      const effectiveOrgId = this.getAuthorizedOrgId(user)
      const stats = await this.auditLogService.getStatistics(effectiveOrgId)

      return response.ok({
        status: 'success',
        data: stats,
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Failed to fetch audit statistics',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Get all distinct modules for filtering
   */
  async getModules({ auth, response }: HttpContext) {
    const user = auth.user!
    if (!this.canAccessAuditLogs(user)) {
      return response.forbidden({ status: 'error', message: 'Forbidden' })
    }

    try {
      const effectiveOrgId = this.getAuthorizedOrgId(user)
      const modules = await this.auditLogService.getModules(effectiveOrgId)

      return response.ok({
        status: 'success',
        data: modules,
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Failed to fetch modules',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Get all distinct actions for filtering
   */
  async getActions({ auth, response }: HttpContext) {
    const user = auth.user!
    if (!this.canAccessAuditLogs(user)) {
      return response.forbidden({ status: 'error', message: 'Forbidden' })
    }

    try {
      const effectiveOrgId = this.getAuthorizedOrgId(user)
      const actions = await this.auditLogService.getActions(effectiveOrgId)

      return response.ok({
        status: 'success',
        data: actions,
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Failed to fetch actions',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Export audit logs to CSV
   */
  async export({ auth, request, response }: HttpContext) {
    const user = auth.user!

    if (!this.canAccessAuditLogs(user)) {
      return response.forbidden({
        status: 'error',
        message: 'You do not have permission to export audit logs.',
      })
    }

    const {
      module,
      action,
      user_id,
      employeeId,
      startDate,
      start_date,
      endDate,
      end_date,
      status,
      search,
    } = request.qs()

    try {
      const effectiveOrgId = this.getAuthorizedOrgId(user)
      const result = await this.auditLogService.exportLogs({
        orgId: effectiveOrgId,
        module: module ? String(module).trim() : undefined,
        action: action ? String(action).trim() : undefined,
        userId: user_id ? parseInt(user_id, 10) : employeeId ? parseInt(employeeId, 10) : undefined,
        startDate: startDate || start_date || undefined,
        endDate: endDate || end_date || undefined,
        status: status ? String(status).trim() : undefined,
        search: search ? String(search).trim() : undefined,
      })

      const csvRows = [
        result.headers.join(','),
        ...result.rows.map((row) =>
          row
            .map((cell) => {
              const value = String(cell ?? '')
              if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(',')
        ),
      ]
      const csvContent = csvRows.join('\n')

      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', `attachment; filename="audit_logs_${Date.now()}.csv"`)

      return response.send({
        status: 'success',
        data: csvContent,
        meta: { total: result.total },
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Failed to export audit logs',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
