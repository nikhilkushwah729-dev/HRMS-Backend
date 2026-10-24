import { HttpContext } from '@adonisjs/core/http'
import RegularizationService from '#services/RegularizationService'
import AuthorizationService from '#services/AuthorizationService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class RegularizationsController {
    constructor(
        protected regularizationService: RegularizationService,
        protected authorizationService: AuthorizationService
    ) { }

    static submitValidator = vine.compile(
        vine.object({
            date: vine.string().optional(),
            regularizationDate: vine.string().optional(),
            type: vine.enum(['missed_punch', 'late_arrival', 'early_departure', 'half_day', 'overtime', 'other']),
            reason: vine.string().trim().minLength(3),
            checkIn: vine.string().trim().optional(),
            check_in: vine.string().trim().optional(),
            checkOut: vine.string().trim().optional(),
            check_out: vine.string().trim().optional(),
            attendanceId: vine.number().optional()
        })
    )

    static processValidator = vine.compile(
        vine.object({
            status: vine.enum(['approved', 'rejected']),
            notes: vine.string().trim().optional(),
            rejectionNote: vine.string().trim().optional(),
            reason: vine.string().trim().optional()
        })
    )

    /**
     * Employee submits a request
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(RegularizationsController.submitValidator)

        const normalizedDate = data.date || data.regularizationDate
        if (!normalizedDate) {
            return response.badRequest({
                status: 'error',
                message: 'Date is required for regularization request'
            })
        }

        const result = await this.regularizationService.submitRequest(employee.id, employee.orgId, {
            ...data,
            date: normalizedDate,
            checkIn: data.checkIn || data.check_in,
            checkOut: data.checkOut || data.check_out,
        })

        return response.created({
            status: 'success',
            message: 'Regularization request submitted successfully',
            data: result
        })
    }

    /**
     * View requests (Admin sees org queue with filters; Employee sees only their own requests)
     */
    async index({ auth, request, response }: HttpContext) {
        const user = auth.user!
        const qs = request.qs()

        const canApprove = await this.authorizationService.hasPermission(user, 'attendance_approve')
        const isSelfQuery = qs.self === 'true' || qs.mine === 'true'

        const filters: {
            employeeId?: number
            status?: string
            type?: string
            startDate?: string
            endDate?: string
        } = {}

        if (!canApprove || isSelfQuery) {
            filters.employeeId = user.id
        } else if (qs.employeeId) {
            filters.employeeId = Number(qs.employeeId)
        }

        if (qs.status) {
            filters.status = String(qs.status).trim()
        }
        if (qs.type) {
            filters.type = String(qs.type).trim()
        }
        if (qs.startDate) {
            filters.startDate = String(qs.startDate).trim()
        }
        if (qs.endDate) {
            filters.endDate = String(qs.endDate).trim()
        }

        const requests = await this.regularizationService.getRequests(user.orgId, filters)

        return response.ok({
            status: 'success',
            data: requests
        })
    }

    /**
     * Admin processes a request
     */
    async update({ auth, params, request, response }: HttpContext) {
        const admin = auth.user!
        const canApprove = await this.authorizationService.hasPermission(admin, 'attendance_approve')
        if (!canApprove) {
            return response.forbidden({
                status: 'error',
                message: 'You do not have permission to approve or reject attendance regularizations'
            })
        }

        const data = await request.validateUsing(RegularizationsController.processValidator)
        const notes = data.notes || data.rejectionNote || data.reason

        const result = await this.regularizationService.processRequest(
            Number(params.id),
            admin.id,
            admin.orgId,
            data.status,
            notes
        )

        return response.ok({
            status: 'success',
            message: `Regularization request ${data.status} successfully`,
            data: result
        })
    }
}
