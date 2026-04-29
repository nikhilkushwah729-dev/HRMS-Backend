import { HttpContext } from '@adonisjs/core/http'
import TimesheetService from '#services/TimesheetService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class TimesheetsController {
  constructor(protected timesheetService: TimesheetService) {}

  static upsertValidator = vine.compile(
    vine.object({
      projectId: vine.number().optional(),
      taskId: vine.number().optional(),
      clientName: vine.string().trim().maxLength(120).optional(),
      entryMode: vine.enum(['daily', 'weekly']).optional(),
      workDate: vine.string(),
      weekStart: vine.string().optional(),
      startTime: vine.string().optional(),
      endTime: vine.string().optional(),
      totalHours: vine.number().min(0).max(24).optional(),
      hoursWorked: vine.number().min(0).max(24).optional(),
      isBillable: vine.boolean().optional(),
      description: vine.string().trim().maxLength(4000).optional(),
      status: vine.enum(['draft', 'pending']).optional(),
    })
  )

  static approvalActionValidator = vine.compile(
    vine.object({
      action: vine.enum(['approve', 'reject', 'send_back', 'lock']),
      note: vine.string().trim().maxLength(2000).optional(),
    })
  )

  static bulkApprovalActionValidator = vine.compile(
    vine.object({
      ids: vine.array(vine.number()),
      action: vine.enum(['approve', 'reject', 'send_back']),
      note: vine.string().trim().maxLength(2000).optional(),
    })
  )

  async index({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const timesheets = await this.timesheetService.listSelf(employee.id, employee.orgId, request.qs())
    return response.ok({ status: 'success', data: timesheets })
  }

  async store({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(TimesheetsController.upsertValidator)
    const timesheet = await this.timesheetService.create(employee.id, employee.orgId, data)
    return response.created({ status: 'success', data: timesheet })
  }

  async show({ auth, params, response }: HttpContext) {
    const employee = auth.user!
    const timesheet = await this.timesheetService.getById(Number(params.id), employee, false)
    return response.ok({ status: 'success', data: timesheet })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(TimesheetsController.upsertValidator)
    const timesheet = await this.timesheetService.update(Number(params.id), employee, data)
    return response.ok({ status: 'success', data: timesheet })
  }

  async submit({ auth, params, response }: HttpContext) {
    const employee = auth.user!
    const timesheet = await this.timesheetService.submit(Number(params.id), employee)
    return response.ok({ status: 'success', data: timesheet })
  }

  async approvalIndex({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const items = await this.timesheetService.listForApproval(employee, request.qs())
    return response.ok({ status: 'success', data: items })
  }

  async approvalDetail({ auth, params, response }: HttpContext) {
    const employee = auth.user!
    const item = await this.timesheetService.getById(Number(params.id), employee, true)
    return response.ok({ status: 'success', data: item })
  }

  async approvalAction({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const { action, note } = await request.validateUsing(TimesheetsController.approvalActionValidator)
    const item = await this.timesheetService.review(Number(params.id), employee, action, note)
    return response.ok({ status: 'success', data: item })
  }

  async bulkApprovalAction({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const { ids, action, note } = await request.validateUsing(TimesheetsController.bulkApprovalActionValidator)
    const results = await this.timesheetService.bulkReview(employee, ids, action, note)
    return response.ok({ status: 'success', data: results })
  }

  async reports({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.timesheetService.reports(employee, request.qs())
    return response.ok({ status: 'success', data })
  }
}
