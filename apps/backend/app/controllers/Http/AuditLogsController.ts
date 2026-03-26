import { HttpContext } from '@adonisjs/core/http'
import AuditLogService from '#services/AuditLogService'
import { inject } from '@adonisjs/core'

@inject()
export default class AuditLogsController {
    constructor(protected auditLogService: AuditLogService) { }

    /**
     * Create a new audit log entry
     * Body params: action, module, entityName, entityId, oldValues, newValues
     */
    async store({ auth, request, response }: HttpContext) {
        const user = auth.user!
        
        const {
            action,
            module,
            entityName,
            entityId,
            oldValues,
            newValues
        } = request.body()

        // Validate required fields
        if (!action || !module) {
            return response.badRequest({
                status: 'error',
                message: 'Action and module are required fields'
            })
        }

        try {
            const auditLog = await this.auditLogService.log({
                orgId: user.orgId,
                employeeId: user.id,
                action,
                module,
                entityName: entityName || undefined,
                entityId: entityId !== undefined ? String(entityId) : undefined,
                oldValues: oldValues || undefined,
                newValues: newValues || undefined,
                ctx: { auth, request, response } as HttpContext
            })

            return response.created({
                status: 'success',
                data: auditLog
            })
        } catch (error) {
            return response.internalServerError({
                status: 'error',
                message: 'Failed to create audit log',
                error: error.message
            })
        }
    }

    /**
     * List audit logs for the current organization with advanced filtering
     * Query params: module, action, employeeId, startDate, endDate, search, page, limit
     */
    async index({ auth, request, response }: HttpContext) {
        const user = auth.user!
        const { 
            module, 
            action, 
            employeeId, 
            startDate, 
            endDate, 
            search, 
            page, 
            limit 
        } = request.qs()

        // Parse query parameters
        const parsedPage = page ? parseInt(page, 10) : 1
        const parsedLimit = limit ? parseInt(limit, 10) : 50

        // Validate pagination limits
        const validLimit = Math.min(Math.max(parsedLimit, 1), 100) // Max 100 per page

        try {
            const result = await this.auditLogService.getLogs({
                orgId: user.orgId,
                module: module || undefined,
                action: action || undefined,
                employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                search: search || undefined,
                page: parsedPage,
                limit: validLimit
            })

            return response.ok({
                status: 'success',
                data: result.data,
                meta: result.meta
            })
        } catch (error) {
            return response.internalServerError({
                status: 'error',
                message: 'Failed to fetch audit logs',
                error: error.message
            })
        }
    }

    /**
     * Get a single audit log by ID
     */
    async show({ auth, params, response }: HttpContext) {
        const user = auth.user!
        const id = parseInt(params.id, 10)

        if (isNaN(id)) {
            return response.badRequest({
                status: 'error',
                message: 'Invalid audit log ID'
            })
        }

        try {
            const log = await this.auditLogService.getLogById(id, user.orgId)

            if (!log) {
                return response.notFound({
                    status: 'error',
                    message: 'Audit log not found'
                })
            }

            return response.ok({
                status: 'success',
                data: log
            })
        } catch (error) {
            return response.internalServerError({
                status: 'error',
                message: 'Failed to fetch audit log',
                error: error.message
            })
        }
    }

    /**
     * Get all available modules for filtering
     */
    async getModules({ auth, response }: HttpContext) {
        const user = auth.user!

        try {
            const modules = await this.auditLogService.getModules(user.orgId)

            return response.ok({
                status: 'success',
                data: modules
            })
        } catch (error) {
            return response.internalServerError({
                status: 'error',
                message: 'Failed to fetch modules',
                error: error.message
            })
        }
    }

    /**
     * Get all available actions for filtering
     */
    async getActions({ auth, response }: HttpContext) {
        const user = auth.user!

        try {
            const actions = await this.auditLogService.getActions(user.orgId)

            return response.ok({
                status: 'success',
                data: actions
            })
        } catch (error) {
            return response.internalServerError({
                status: 'error',
                message: 'Failed to fetch actions',
                error: error.message
            })
        }
    }

    /**
     * Export audit logs to CSV
     * Query params: module, action, employeeId, startDate, endDate
     */
    async export({ auth, request, response }: HttpContext) {
        const user = auth.user!
        const { 
            module, 
            action, 
            employeeId, 
            startDate, 
            endDate 
        } = request.qs()

        try {
            const result = await this.auditLogService.exportLogs({
                orgId: user.orgId,
                module: module || undefined,
                action: action || undefined,
                employeeId: employeeId ? parseInt(employeeId, 10) : undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            })

            // Convert to CSV string
            const csvRows = [
                result.headers.join(','),
                ...result.rows.map(row => row.map(cell => {
                    // Escape CSV values
                    const value = String(cell || '')
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        return `"${value.replace(/"/g, '""')}"`
                    }
                    return value
                }).join(','))
            ]
            const csvContent = csvRows.join('\n')

            // Set headers for CSV download
            response.header('Content-Type', 'text/csv')
            response.header('Content-Disposition', `attachment; filename="audit_logs_${Date.now()}.csv"`)

            return response.send({
                status: 'success',
                data: csvContent,
                meta: { total: result.total }
            })
        } catch (error) {
            return response.internalServerError({
                status: 'error',
                message: 'Failed to export audit logs',
                error: error.message
            })
        }
    }
}
