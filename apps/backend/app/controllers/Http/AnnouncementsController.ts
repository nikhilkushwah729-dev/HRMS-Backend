import { HttpContext } from '@adonisjs/core/http'
import AnnouncementService from '#services/AnnouncementService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import { Exception } from '@adonisjs/core/exceptions'

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

    async show({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const announcement = await this.announcementService.show(employee.orgId, Number(params.id))

        if (!announcement) {
            return response.notFound({ status: 'error', message: 'Announcement not found' })
        }

        return response.ok({ status: 'success', data: announcement })
    }

    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AnnouncementsController.announcementValidator)
        const announcement = await this.announcementService.create(employee.orgId, employee.id, data)
        return response.created({ status: 'success', data: announcement })
    }

    async update({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const payload = await request.validateUsing(
            vine.compile(
                vine.object({
                    title: vine.string().maxLength(200).optional(),
                    content: vine.string().optional(),
                    target: vine.enum(['all', 'department', 'role'] as const).optional(),
                    targetId: vine.number().nullable().optional(),
                    expiresAt: vine.string().nullable().optional(),
                    deleted_at: vine.string().nullable().optional(),
                })
            )
        )

        const updateData = {
            ...(payload.title !== undefined ? { title: payload.title } : {}),
            ...(payload.content !== undefined ? { content: payload.content } : {}),
            ...(payload.target !== undefined ? { target: payload.target } : {}),
            ...(payload.targetId !== undefined ? { targetId: payload.targetId } : {}),
            ...(payload.expiresAt !== undefined ? { expiresAt: payload.expiresAt } : {}),
            ...(payload.deleted_at !== undefined ? { deletedAt: payload.deleted_at } : {}),
        }

        if (!Object.keys(updateData).length) {
            throw new Exception('No valid announcement fields provided', { status: 400 })
        }

        const announcement = await this.announcementService.update(employee.orgId, Number(params.id), updateData)
        return response.ok({ status: 'success', data: announcement })
    }
}
