import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import VisitManagementService from '#services/VisitManagementService'
import MediaUploadService from '#services/MediaUploadService'

@inject()
export default class VisitManagementController {
  constructor(
    protected visitManagementService: VisitManagementService,
    protected mediaUploadService: MediaUploadService
  ) {}

  static clientValidator = vine.compile(
    vine.object({
      name: vine.string().trim().minLength(2).maxLength(150),
      industry: vine.string().trim().maxLength(120).optional(),
      contactPerson: vine.string().trim().maxLength(150).optional(),
      email: vine.string().email().optional(),
      phone: vine.string().trim().maxLength(50).optional(),
      address: vine.string().trim().optional(),
      isActive: vine.boolean().optional(),
    })
  )

  static visitorValidator = vine.compile(
    vine.object({
      clientId: vine.number().nullable().optional(),
      fullName: vine.string().trim().minLength(2).maxLength(150),
      email: vine.string().email().optional(),
      phone: vine.string().trim().maxLength(50).optional(),
      designation: vine.string().trim().maxLength(150).optional(),
      address: vine.string().trim().optional(),
      notes: vine.string().trim().optional(),
      isActive: vine.boolean().optional(),
    })
  )

  static visitValidator = vine.compile(
    vine.object({
      clientId: vine.number().nullable().optional(),
      visitorId: vine.number().nullable().optional(),
      hostEmployeeId: vine.number().nullable().optional(),
      approverEmployeeId: vine.number().nullable().optional(),
      title: vine.string().trim().minLength(3).maxLength(180),
      purpose: vine.string().trim().minLength(3),
      locationName: vine.string().trim().maxLength(180).optional(),
      visitType: vine.enum(['client_meeting', 'site_visit', 'interview', 'follow_up', 'delivery', 'other'] as const).optional(),
      priority: vine.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
      requiresApproval: vine.boolean().optional(),
      scheduledStart: vine.string(),
      scheduledEnd: vine.string().optional(),
      reminderAt: vine.string().optional(),
      initialNote: vine.string().optional(),
      photoProofBase64: vine.string().optional(),
      attachmentUrls: vine.array(vine.string()).optional(),
    })
  )

  static reviewValidator = vine.compile(
    vine.object({
      action: vine.enum(['approve', 'reject'] as const),
      notes: vine.string().optional(),
    })
  )

  static checkFlowValidator = vine.compile(
    vine.object({
      latitude: vine.number().optional(),
      longitude: vine.number().optional(),
      address: vine.string().optional(),
      note: vine.string().optional(),
      completionNotes: vine.string().optional(),
      photoProofBase64: vine.string().optional(),
      attachmentUrls: vine.array(vine.string()).optional(),
    })
  )

  static noteValidator = vine.compile(
    vine.object({
      noteType: vine.enum(['general', 'planning', 'check_in', 'check_out', 'follow_up'] as const).optional(),
      content: vine.string().trim().minLength(2),
      photoProofBase64: vine.string().optional(),
      attachmentUrls: vine.array(vine.string()).optional(),
    })
  )

  static followUpValidator = vine.compile(
    vine.object({
      title: vine.string().trim().minLength(2).maxLength(180),
      description: vine.string().optional(),
      assignedTo: vine.number().nullable().optional(),
      status: vine.enum(['open', 'in_progress', 'completed'] as const).optional(),
      priority: vine.enum(['low', 'medium', 'high', 'critical'] as const).optional(),
      dueAt: vine.string().optional(),
    })
  )

  private async resolvePhotoProof(data: { photoProofBase64?: string; photoProofUrl?: string | null }, folder: string) {
    const photoProofUrl = await this.mediaUploadService.storeImage(data.photoProofBase64, folder)
    return photoProofUrl ?? data.photoProofUrl ?? null
  }

  async dashboard({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.getDashboard(employee)
    return response.ok({ status: 'success', data })
  }

  async references({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.getReferenceData(employee)
    return response.ok({ status: 'success', data })
  }

  async reports({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.getReports(employee, {
      status: request.input('status'),
      search: request.input('search'),
      dateFrom: request.input('dateFrom'),
      dateTo: request.input('dateTo'),
    })
    return response.ok({ status: 'success', data })
  }

  async exportReports({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.getReports(employee, {
      status: request.input('status'),
      search: request.input('search'),
      dateFrom: request.input('dateFrom'),
      dateTo: request.input('dateTo'),
    })

    const format = String(request.input('format', 'csv')).toLowerCase()

    if (format === 'json') {
      response.header('Content-Type', 'application/json')
      response.header('Content-Disposition', 'attachment; filename="visit-report.json"')
      return response.send(JSON.stringify(data, null, 2))
    }

    const headers = [
      'Title',
      'Status',
      'Priority',
      'Visit Type',
      'Client',
      'Visitor',
      'Host',
      'Scheduled Start',
      'Scheduled End',
      'Check In',
      'Check Out',
      'Location',
    ]

    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = (data?.visits ?? []).map((visit: any) =>
      [
        visit.title,
        visit.status,
        visit.priority,
        visit.visitType,
        visit.client?.name,
        visit.visitor?.fullName,
        visit.host?.name,
        visit.scheduledStart,
        visit.scheduledEnd,
        visit.actualCheckInAt,
        visit.actualCheckOutAt,
        visit.locationName,
      ].map(escape).join(',')
    )

    const csv = [headers.join(','), ...rows].join('\n')
    response.header('Content-Type', 'text/csv')
    response.header('Content-Disposition', 'attachment; filename="visit-report.csv"')
    return response.send(csv)
  }

  async listClients({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.listClients(employee.orgId)
    return response.ok({ status: 'success', data })
  }

  async createClient({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.clientValidator)
    const data = await this.visitManagementService.createClient(employee.orgId, payload)
    return response.created({ status: 'success', data })
  }

  async updateClient({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.clientValidator)
    const data = await this.visitManagementService.updateClient(employee.orgId, Number(params.id), payload)
    return response.ok({ status: 'success', data })
  }

  async listVisitors({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.listVisitors(employee.orgId)
    return response.ok({ status: 'success', data })
  }

  async createVisitor({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.visitorValidator)
    const data = await this.visitManagementService.createVisitor(employee.orgId, payload)
    return response.created({ status: 'success', data })
  }

  async updateVisitor({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.visitorValidator)
    const data = await this.visitManagementService.updateVisitor(employee.orgId, Number(params.id), payload)
    return response.ok({ status: 'success', data })
  }

  async index({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.listVisits(employee, {
      status: request.input('status'),
      search: request.input('search'),
      dateFrom: request.input('dateFrom'),
      dateTo: request.input('dateTo'),
    })
    return response.ok({ status: 'success', data })
  }

  async store({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.visitValidator)
    const data = await this.visitManagementService.createVisit(employee, {
      ...payload,
      photoProofUrl: await this.resolvePhotoProof(payload, 'visits'),
    })
    return response.created({ status: 'success', data })
  }

  async show({ auth, params, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.visitManagementService.getVisitDetail(employee, Number(params.id))
    return response.ok({ status: 'success', data })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.visitValidator)
    const data = await this.visitManagementService.updateVisit(employee, Number(params.id), {
      ...payload,
      photoProofUrl: await this.resolvePhotoProof(payload, 'visits'),
    })
    return response.ok({ status: 'success', data })
  }

  async review({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.reviewValidator)
    const data = await this.visitManagementService.reviewVisit(employee, Number(params.id), payload.action, payload.notes)
    return response.ok({ status: 'success', data })
  }

  async checkIn({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.checkFlowValidator)
    const data = await this.visitManagementService.checkIn(employee, Number(params.id), {
      ...payload,
      photoProofUrl: await this.resolvePhotoProof(payload, 'visit-checkins'),
    })
    return response.ok({ status: 'success', data })
  }

  async checkOut({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.checkFlowValidator)
    const data = await this.visitManagementService.checkOut(employee, Number(params.id), {
      ...payload,
      photoProofUrl: await this.resolvePhotoProof(payload, 'visit-checkouts'),
    })
    return response.ok({ status: 'success', data })
  }

  async addNote({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.noteValidator)
    const data = await this.visitManagementService.addNote(employee, Number(params.id), {
      ...payload,
      photoProofUrl: await this.resolvePhotoProof(payload, 'visit-notes'),
    })
    return response.created({ status: 'success', data })
  }

  async addFollowUp({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.followUpValidator)
    const data = await this.visitManagementService.createFollowUp(employee, Number(params.id), payload)
    return response.created({ status: 'success', data })
  }

  async updateFollowUp({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const payload = await request.validateUsing(VisitManagementController.followUpValidator)
    const data = await this.visitManagementService.updateFollowUp(employee, Number(params.followUpId), payload)
    return response.ok({ status: 'success', data })
  }
}
