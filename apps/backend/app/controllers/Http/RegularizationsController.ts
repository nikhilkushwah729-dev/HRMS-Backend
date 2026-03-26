import { HttpContext } from '@adonisjs/core/http'
import RegularizationService from '#services/RegularizationService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class RegularizationsController {
    constructor(protected regularizationService: RegularizationService) { }

    static submitValidator = vine.compile(
        vine.object({
            date: vine.string(),
            type: vine.enum(['missed_punch', 'late_arrival', 'half_day', 'other']),
            reason: vine.string().minLength(10),
            attendanceId: vine.number().optional()
        })
    )

    static processValidator = vine.compile(
        vine.object({
            status: vine.enum(['approved', 'rejected']),
            notes: vine.string().optional()
        })
    )

    /**
     * Employee submits a request
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(RegularizationsController.submitValidator)
        const result = await this.regularizationService.submitRequest(employee.id, employee.orgId, data)
        return response.created({
            status: 'success',
            message: 'Regularization request submitted',
            data: result
        })
    }

    /**
     * Admin/Manager views pending requests
     */
    async index({ auth, response }: HttpContext) {
        const user = auth.user!
        const requests = await this.regularizationService.getPendingRequests(user.orgId)
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
        const data = await request.validateUsing(RegularizationsController.processValidator)
        const result = await this.regularizationService.processRequest(params.id, admin.id, data.status, data.notes)
        return response.ok({
            status: 'success',
            message: `Request ${data.status} successfully`,
            data: result
        })
    }
}
