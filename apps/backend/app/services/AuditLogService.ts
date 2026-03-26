import AuditLog from '#models/audit_log'
import { HttpContext } from '@adonisjs/core/http'
import GeoService from '#services/GeoService'
import { inject } from '@adonisjs/core'

/**
 * Get the real client IP address from the request.
 * Checks X-Forwarded-For header first (for proxied requests),
 * then X-Real-IP header, and falls back to request.ip()
 */
function getClientIp(ctx: HttpContext): string | null {
    const request = ctx.request

    // Check X-Forwarded-For header (may contain multiple IPs: client, proxy1, proxy2)
    const forwardedFor = request.header('x-forwarded-for')
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map(ip => ip.trim())
        if (ips.length > 0 && ips[0]) {
            return ips[0]
        }
    }

    // Check X-Real-IP header (commonly used by Nginx, proxies)
    const realIp = request.header('x-real-ip')
    if (realIp) {
        return realIp.trim()
    }

    // Fall back to AdonisJS's built-in ip() method
    return request.ip()
}

@inject()
export default class AuditLogService {
    constructor(protected geoService: GeoService) { }

    /**
     * Automatically log an action with current HTTP context details
     */
    async log(params: {
        orgId?: number
        employeeId?: number
        action: string
        module: string
        entityName?: string
        entityId?: string | number
        oldValues?: any
        newValues?: any
        ipAddress?: string | null
        userAgent?: string | null
        ctx?: HttpContext
    }) {
        const {
            orgId,
            employeeId,
            action,
            module,
            entityName,
            entityId,
            oldValues,
            newValues,
            ctx
        } = params

        let ipAddress: string | null = params.ipAddress ?? null
        let userAgent: string | null = params.userAgent ?? null

        if (ctx) {
            ipAddress = getClientIp(ctx)
            userAgent = ctx.request.header('user-agent') ?? null
        }

        let countryCode = null
        let countryName = null
        let regionName = null
        let cityName = null
        let latitude = null
        let longitude = null

        if (ipAddress) {
            const geoInfo = await this.geoService.getLocationFromIp(ipAddress)
            if (geoInfo) {
                countryCode = geoInfo.countryCode
                countryName = geoInfo.countryName
                regionName = geoInfo.regionName
                cityName = geoInfo.cityName
                latitude = geoInfo.lat
                longitude = geoInfo.lng
            }
        }

        try {
            return await AuditLog.create({
                orgId,
                employeeId,
                action,
                module,
                entityName,
                entityId: entityId ? String(entityId) : null,
                oldValues: oldValues ? JSON.stringify(oldValues) : null,
                newValues: newValues ? JSON.stringify(newValues) : null,
                ipAddress,
                userAgent,
                countryCode,
                countryName,
                regionName,
                cityName,
                latitude,
                longitude,
            })
        } catch (error) {
            // We don't want audit log failures to crash the main transaction
            console.error('Failed to create audit log:', error)
            return null
        }
    }

    /**
     * Get audit logs with advanced filtering, pagination, and search
     */
    async getLogs(params: {
        orgId: number
        module?: string
        action?: string
        employeeId?: number
        startDate?: string | Date
        endDate?: string | Date
        search?: string
        page?: number
        limit?: number
    }) {
        const {
            orgId,
            module,
            action,
            employeeId,
            startDate,
            endDate,
            search,
            page = 1,
            limit = 50
        } = params

        let query = AuditLog.query()
            .where('orgId', orgId)
            .preload('employee')
            .orderBy('createdAt', 'desc')

        // Filter by module
        if (module) {
            query = query.where('module', module)
        }

        // Filter by action type
        if (action) {
            query = query.where('action', action)
        }

        // Filter by employee
        if (employeeId) {
            query = query.where('employeeId', employeeId)
        }

        // Filter by date range
        if (startDate) {
            const start = typeof startDate === 'string' ? new Date(startDate) : startDate
            query = query.where('createdAt', '>=', start)
        }

        if (endDate) {
            const end = typeof endDate === 'string' ? new Date(endDate) : endDate
            // Add one day to include the entire end date
            end.setHours(23, 59, 59, 999)
            query = query.where('createdAt', '<=', end)
        }

        // Search in entityName, entityId, oldValues, newValues
        if (search) {
            query = query.where((builder) => {
                builder
                    .where('entityName', 'like', `%${search}%`)
                    .orWhere('entityId', 'like', `%${search}%`)
                    .orWhere('newValues', 'like', `%${search}%`)
                    .orWhere('oldValues', 'like', `%${search}%`)
            })
        }

        // Pagination
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
            }
        }
    }

    /**
     * Get a single audit log by ID
     */
    async getLogById(id: number, orgId: number) {
        return await AuditLog.query()
            .where('id', id)
            .where('orgId', orgId)
            .preload('employee')
            .first()
    }

    /**
     * Get all available modules for filtering
     */
    async getModules(orgId: number) {
        const results = await AuditLog.query()
            .where('orgId', orgId)
            .select('module')
            .distinct()
            .orderBy('module', 'asc')
        
        return results.map(r => r.module)
    }

    /**
     * Get all available actions for filtering
     */
    async getActions(orgId: number) {
        const results = await AuditLog.query()
            .where('orgId', orgId)
            .select('action')
            .distinct()
            .orderBy('action', 'asc')
        
        return results.map(r => r.action)
    }

    /**
     * Export audit logs to CSV format
     */
    async exportLogs(params: {
        orgId: number
        module?: string
        action?: string
        employeeId?: number
        startDate?: string | Date
        endDate?: string | Date
    }) {
        const logs = await this.getLogs({
            ...params,
            page: 1,
            limit: 10000 // Max export limit
        })

        // Generate CSV content
        const headers = ['ID', 'Date', 'Action', 'Module', 'Entity Name', 'Entity ID', 'Employee', 'IP Address', 'Country', 'User Agent']
        const rows = logs.data.map(log => [
            log.id,
            log.createdAt?.toISO() || '',
            log.action,
            log.module,
            log.entityName || '',
            log.entityId || '',
            log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : '',
            log.ipAddress || '',
            log.countryCode || '',
            log.userAgent || ''
        ])

        return {
            headers,
            rows,
            total: logs.meta.total
        }
    }
}
