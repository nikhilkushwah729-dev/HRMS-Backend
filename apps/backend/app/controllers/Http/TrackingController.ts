import { HttpContext } from '@adonisjs/core/http'
import TrackingService from '#services/TrackingService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class TrackingController {
    constructor(protected trackingService: TrackingService) { }

    static updateValidator = vine.compile(
        vine.object({
            latitude: vine.number(),
            longitude: vine.number(),
        })
    )

    /**
     * Update current location
     */
    async update({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(TrackingController.updateValidator)

        const result = await this.trackingService.updateLocation(employee.id, employee.orgId, data)

        return response.ok({
            status: 'success',
            data: result
        })
    }

    /**
     * Get location history
     */
    async history({ auth, response }: HttpContext) {
        const employee = auth.user!
        const history = await this.trackingService.getHistory(employee.id, employee.orgId)

        return response.ok({
            status: 'success',
            data: history
        })
    }
}
