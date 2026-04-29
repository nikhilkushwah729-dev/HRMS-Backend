import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { inject } from '@adonisjs/core'
import MediaUploadService from '#services/MediaUploadService'
import EmployeeSelfServiceService from '#services/EmployeeSelfServiceService'
import AuditLogService from '#services/AuditLogService'
import KioskAttendanceService from '#services/KioskAttendanceService'

@inject()
export default class EmployeeSelfServiceController {
  constructor(
    protected essService: EmployeeSelfServiceService,
    protected mediaUploadService: MediaUploadService,
    protected auditLogService: AuditLogService,
    protected kioskAttendanceService: KioskAttendanceService,
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

  static approvalActionValidator = vine.compile(
    vine.object({
      action: vine.enum(['approved', 'rejected', 'sent_back'] as const),
      comment: vine.string().trim().optional(),
    })
  )

  static bulkApprovalActionValidator = vine.compile(
    vine.object({
      ids: vine.array(vine.number()).minLength(1),
      action: vine.enum(['approved', 'rejected'] as const),
      comment: vine.string().trim().optional(),
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

  async approvalQueue({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.essService.listApprovalRequests(employee, {
      type: request.input('type'),
      status: request.input('status'),
      employeeId: request.input('employeeId'),
      department: request.input('department'),
      search: request.input('search'),
      fromDate: request.input('fromDate'),
      toDate: request.input('toDate'),
    })
    return response.ok({ status: 'success', data })
  }

  async approvalDetail({ auth, params, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.essService.getApprovalRequest(employee, Number(params.id))
    if (!data) {
      return response.notFound({ status: 'error', message: 'Request not found' })
    }
    return response.ok({ status: 'success', data })
  }

  async approvalAction({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(EmployeeSelfServiceController.approvalActionValidator)
    const data = await this.essService.processApprovalRequest(employee, Number(params.id), payload)

    await this.auditLogService.log({
      orgId: employee.orgId,
      employeeId: employee.id,
      action: 'UPDATE',
      module: 'approval_center',
      entityName: 'ess_requests',
      entityId: params.id,
      newValues: { action: payload.action, comment: payload.comment ?? null },
      ctx: { request } as any,
    })

    return response.ok({ status: 'success', data })
  }

  async bulkApprovalAction({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(EmployeeSelfServiceController.bulkApprovalActionValidator)
    const data = await this.essService.bulkProcessApprovalRequests(employee, payload)

    await this.auditLogService.log({
      orgId: employee.orgId,
      employeeId: employee.id,
      action: 'UPDATE',
      module: 'approval_center',
      entityName: 'ess_requests',
      entityId: payload.ids.join(','),
      newValues: { action: payload.action, count: data.length, comment: payload.comment ?? null },
      ctx: { request } as any,
    })

    return response.ok({ status: 'success', data })
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

  async kioskQrToken({ auth, response }: HttpContext) {
    const employee = auth.user!

    if (!employee.employeeCode) {
      return response.badRequest({
        status: 'error',
        message: 'Employee code is required before QR attendance can be generated',
      })
    }

    const qr = this.kioskAttendanceService.generateEmployeeQrToken(employee.employeeCode, 2)
    return response.ok({
      status: 'success',
      data: {
        employeeCode: employee.employeeCode,
        token: qr.token,
        expiresAt: qr.expiresAt,
      },
    })
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
