import { HttpContext } from '@adonisjs/core/http'
import TimesheetService from '#services/TimesheetService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class TimesheetsController {
    constructor(protected timesheetService: TimesheetService) { }

    static timesheetValidator = vine.compile(
        vine.object({
            projectId: vine.number().optional(),
            taskId: vine.number().optional(),
            workDate: vine.string(),
            hoursWorked: vine.number().min(0), // Keeping parameter name for frontend if needed, but internally it's durationMinutes
            durationMinutes: vine.number().min(0).optional(),
            description: vine.string().optional(),
        })
    )

    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const timesheets = await this.timesheetService.list(employee.id, employee.orgId)
        return response.ok({ status: 'success', data: timesheets })
    }

    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(TimesheetsController.timesheetValidator)
        const timesheet = await this.timesheetService.create(employee.id, employee.orgId, data)
        return response.created({ status: 'success', data: timesheet })
    }
}
