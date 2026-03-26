import { HttpContext } from '@adonisjs/core/http'
import ProjectService from '#services/ProjectService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class ProjectsController {
    constructor(protected projectService: ProjectService) { }

    static projectValidator = vine.compile(
        vine.object({
            name: vine.string().maxLength(100),
            description: vine.string().optional(),
            startDate: vine.string().optional(),
            endDate: vine.string().optional(),
            status: vine.enum(['active', 'completed', 'on_hold', 'cancelled'] as const).optional(),
        })
    )

    static taskValidator = vine.compile(
        vine.object({
            title: vine.string().maxLength(100),
            description: vine.string().optional(),
            assigneeId: vine.number().optional(),
            priority: vine.enum(['low', 'medium', 'high'] as const).optional(),
            status: vine.enum(['todo', 'in_progress', 'done'] as const).optional(),
            dueDate: vine.string().optional(),
        })
    )

    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const projects = await this.projectService.list(employee.orgId)
        return response.ok({ status: 'success', data: projects })
    }

    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(ProjectsController.projectValidator)
        const project = await this.projectService.create(employee.orgId, data)
        return response.created({ status: 'success', data: project })
    }

    async tasks({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const tasks = await this.projectService.getTasks(params.id, employee.orgId)
        return response.ok({ status: 'success', data: tasks })
    }

    async storeTask({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(ProjectsController.taskValidator)
        const task = await this.projectService.addTask(params.id, employee.orgId, data)
        return response.created({ status: 'success', data: task })
    }
}
