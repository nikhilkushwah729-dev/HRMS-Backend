import { HttpContext } from '@adonisjs/core/http'
import AnnouncementService from '#services/AnnouncementService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class AnnouncementsController {
    constructor(protected announcementService: AnnouncementService) { }

    static announcementValidator = vine.compile(
        vine.object({
            title: vine.string().maxLength(200),
            content: vine.string(),
            target: vine.enum(['all', 'department', 'role'] as const),
            targetId: vine.number().optional(),
            expiresAt: vine.string().optional(),
        })
    )

    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const announcements = await this.announcementService.list(employee.orgId)
        return response.ok({ status: 'success', data: announcements })
    }

    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AnnouncementsController.announcementValidator)
        const announcement = await this.announcementService.create(employee.orgId, employee.id, data)
        return response.created({ status: 'success', data: announcement })
    }
}
