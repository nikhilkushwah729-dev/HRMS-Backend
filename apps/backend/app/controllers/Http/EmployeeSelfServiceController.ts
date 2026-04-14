import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { inject } from '@adonisjs/core'
import MediaUploadService from '#services/MediaUploadService'
import EmployeeSelfServiceService from '#services/EmployeeSelfServiceService'
import AuditLogService from '#services/AuditLogService'

@inject()
export default class EmployeeSelfServiceController {
  constructor(
    protected essService: EmployeeSelfServiceService,
    protected mediaUploadService: MediaUploadService,
    protected auditLogService: AuditLogService,
  ) {}

  static requestValidator = vine.compile(
    vine.object({
      requestType: vine.enum(['leave', 'wfh', 'attendance_correction', 'expense_claim', 'travel_request', 'gate_pass'] as const),
      title: vine.string().trim().minLength(3).maxLength(180),
      description: vine.string().trim().optional(),
      requestDate: vine.string().optional(),
      startDate: vine.string().optional(),
      endDate: vine.string().optional(),
      amount: vine.number().optional(),
      attachmentBase64: vine.string().optional(),
      approverEmployeeId: vine.number().nullable().optional(),
    })
  )

  static passwordValidator = vine.compile(
    vine.object({
      currentPassword: vine.string().minLength(8),
      newPassword: vine.string().minLength(8),
    })
  )

  async dashboard({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.essService.getDashboard(employee)
    return response.ok({ status: 'success', data })
  }

  async listRequests({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.essService.listRequests(employee, {
      type: request.input('type'),
      status: request.input('status'),
    })
    return response.ok({ status: 'success', data })
  }

  async createRequest({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(EmployeeSelfServiceController.requestValidator)
    const attachmentUrl = await this.mediaUploadService.storeImage(payload.attachmentBase64, 'ess-requests')
    const data = await this.essService.createRequest(employee, {
      ...payload,
      attachmentUrl,
      meta: {
        source: 'ess',
      },
    })

    await this.auditLogService.log({
      orgId: employee.orgId,
      employeeId: employee.id,
      action: 'CREATE',
      module: 'ess_requests',
      entityName: 'ess_requests',
      entityId: data?.id,
      newValues: data,
      ctx: { request } as any,
    })

    return response.created({ status: 'success', data })
  }

  async cancelRequest({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    await this.essService.cancelRequest(employee, Number(params.id))
    await this.auditLogService.log({
      orgId: employee.orgId,
      employeeId: employee.id,
      action: 'UPDATE',
      module: 'ess_requests',
      entityName: 'ess_requests',
      entityId: params.id,
      newValues: { status: 'cancelled' },
      ctx: { request } as any,
    })
    return response.ok({ status: 'success', message: 'Request cancelled successfully' })
  }

  async profileAudit({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.essService.getProfileAudit(employee)
    return response.ok({ status: 'success', data })
  }

  async loginActivity({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.essService.getLoginActivity(employee)
    return response.ok({ status: 'success', data })
  }

  async changePassword({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(EmployeeSelfServiceController.passwordValidator)
    await this.essService.changePassword(employee, payload)
    await this.auditLogService.log({
      orgId: employee.orgId,
      employeeId: employee.id,
      action: 'PASSWORD_CHANGE',
      module: 'auth',
      entityName: 'employees',
      entityId: employee.id,
      ctx: { request } as any,
    })
    return response.ok({ status: 'success', message: 'Password changed successfully' })
  }
}
