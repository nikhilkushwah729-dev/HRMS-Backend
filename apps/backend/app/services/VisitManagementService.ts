import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import Employee from '#models/employee'
import Notification from '#models/notification'

type AuthEmployee = {
  id: number
  orgId: number
  roleId: number | null
  managerId?: number | null
}

type VisitFilters = {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export default class VisitManagementService {
  private readonly elevatedRoleIds = new Set([1, 2, 3])

  private parseArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean)
    }

    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.map((item) => String(item || '').trim()).filter(Boolean) : []
      } catch {
        return []
      }
    }

    return []
  }

  private serializeArray(value: unknown): string | null {
    const items = this.parseArray(value)
    return items.length ? JSON.stringify(items) : null
  }

  private formatEmployeeName(raw: any): string {
    return `${raw?.first_name ?? raw?.firstName ?? ''} ${raw?.last_name ?? raw?.lastName ?? ''}`.trim() || 'Unknown'
  }

  private roleName(roleId: number | null | undefined): string {
    const map: Record<number, string> = {
      1: 'Super Admin',
      2: 'Admin',
      3: 'HR Manager',
      4: 'Manager',
      5: 'Employee',
    }
    return roleId ? map[roleId] || 'Employee' : 'Employee'
  }

  private async getDirectReportIds(employeeId: number, orgId: number): Promise<number[]> {
    const reports = await Employee.query().where('org_id', orgId).where('manager_id', employeeId).select('id')
    return reports.map((item) => item.id)
  }

  private async getScope(employee: AuthEmployee) {
    const isElevated = this.elevatedRoleIds.has(Number(employee.roleId ?? 0))
    const isManager = Number(employee.roleId ?? 0) === 4
    const directReportIds = isManager ? await this.getDirectReportIds(employee.id, employee.orgId) : []

    return {
      isElevated,
      isManager,
      directReportIds,
    }
  }

  private async ensureVisitAccessible(employee: AuthEmployee, visitId: number) {
    const visit = await db.from('visits').where('id', visitId).where('org_id', employee.orgId).first()
    if (!visit) {
      throw new Exception('Visit not found', { status: 404 })
    }

    const scope = await this.getScope(employee)
    if (scope.isElevated) {
      return visit
    }

    const allowedIds = new Set([employee.id, ...scope.directReportIds])
    const accessible =
      allowedIds.has(Number(visit.created_by)) ||
      allowedIds.has(Number(visit.host_employee_id)) ||
      allowedIds.has(Number(visit.approver_employee_id))

    if (!accessible) {
      const followUp = await db
        .from('visit_follow_ups')
        .where('visit_id', visitId)
        .where('org_id', employee.orgId)
        .where('assigned_to', employee.id)
        .first()

      if (!followUp) {
        throw new Exception('You do not have access to this visit', { status: 403 })
      }
    }

    return visit
  }

  private async notifyEmployees(orgId: number, employeeIds: Array<number | null | undefined>, title: string, message: string, link: string) {
    const uniqueIds = [...new Set(employeeIds.filter((value): value is number => Number.isFinite(Number(value)) && Number(value) > 0).map((value) => Number(value)))]
    if (!uniqueIds.length) {
      return
    }

    await Promise.all(
      uniqueIds.map((employeeId) =>
        Notification.create({
          orgId,
          employeeId,
          title,
          message,
          type: 'info',
          link,
          isRead: false,
          readAt: null,
        })
      )
    )
  }

  private async serializeVisitRow(raw: any) {
    const notes = await db
      .from('visit_notes as note')
      .leftJoin('employees as employee', 'employee.id', 'note.employee_id')
      .where('note.visit_id', raw.id)
      .orderBy('note.created_at', 'desc')
      .select(
        'note.id',
        'note.note_type',
        'note.content',
        'note.attachment_urls',
        'note.photo_proof_url',
        'note.created_at',
        'employee.id as employee_id',
        'employee.first_name',
        'employee.last_name'
      )

    const followUps = await db
      .from('visit_follow_ups as follow_up')
      .leftJoin('employees as employee', 'employee.id', 'follow_up.assigned_to')
      .where('follow_up.visit_id', raw.id)
      .orderBy('follow_up.created_at', 'desc')
      .select(
        'follow_up.id',
        'follow_up.title',
        'follow_up.description',
        'follow_up.priority',
        'follow_up.status',
        'follow_up.due_at',
        'follow_up.completed_at',
        'follow_up.assigned_to',
        'employee.first_name',
        'employee.last_name'
      )

    return {
      id: Number(raw.id),
      title: raw.title,
      purpose: raw.purpose,
      visitType: raw.visit_type,
      priority: raw.priority,
      status: raw.status,
      locationName: raw.location_name,
      requiresApproval: Boolean(raw.requires_approval),
      scheduledStart: raw.scheduled_start,
      scheduledEnd: raw.scheduled_end,
      reminderAt: raw.reminder_at,
      approvedAt: raw.approved_at,
      approvalNotes: raw.approval_notes,
      completionNotes: raw.completion_notes,
      actualCheckInAt: raw.actual_check_in_at,
      actualCheckOutAt: raw.actual_check_out_at,
      gps: {
        checkIn: raw.check_in_latitude && raw.check_in_longitude
          ? {
              latitude: Number(raw.check_in_latitude),
              longitude: Number(raw.check_in_longitude),
              address: raw.check_in_address || '',
            }
          : null,
        checkOut: raw.check_out_latitude && raw.check_out_longitude
          ? {
              latitude: Number(raw.check_out_latitude),
              longitude: Number(raw.check_out_longitude),
              address: raw.check_out_address || '',
            }
          : null,
      },
      photoProofUrl: raw.photo_proof_url,
      attachmentUrls: this.parseArray(raw.attachment_urls),
      client: raw.client_id
        ? {
            id: Number(raw.client_id),
            name: raw.client_name,
            industry: raw.client_industry,
            contactPerson: raw.client_contact_person,
            email: raw.client_email,
            phone: raw.client_phone,
          }
        : null,
      visitor: raw.visitor_id
        ? {
            id: Number(raw.visitor_id),
            fullName: raw.visitor_full_name,
            email: raw.visitor_email,
            phone: raw.visitor_phone,
            designation: raw.visitor_designation,
          }
        : null,
      host: raw.host_employee_id
        ? {
            id: Number(raw.host_employee_id),
            name: this.formatEmployeeName(raw),
            email: raw.host_email,
          }
        : null,
      approver: raw.approver_employee_id
        ? {
            id: Number(raw.approver_employee_id),
            name: `${raw.approver_first_name ?? ''} ${raw.approver_last_name ?? ''}`.trim(),
          }
        : null,
      createdBy: raw.created_by
        ? {
            id: Number(raw.created_by),
            name: `${raw.creator_first_name ?? ''} ${raw.creator_last_name ?? ''}`.trim(),
          }
        : null,
      notes: notes.map((note) => ({
        id: Number(note.id),
        noteType: note.note_type,
        content: note.content,
        attachmentUrls: this.parseArray(note.attachment_urls),
        photoProofUrl: note.photo_proof_url,
        createdAt: note.created_at,
        employee: note.employee_id
          ? {
              id: Number(note.employee_id),
              name: `${note.first_name ?? ''} ${note.last_name ?? ''}`.trim(),
            }
          : null,
      })),
      followUps: followUps.map((followUp) => ({
        id: Number(followUp.id),
        title: followUp.title,
        description: followUp.description,
        priority: followUp.priority,
        status: followUp.status,
        dueAt: followUp.due_at,
        completedAt: followUp.completed_at,
        assignedTo: followUp.assigned_to
          ? {
              id: Number(followUp.assigned_to),
              name: `${followUp.first_name ?? ''} ${followUp.last_name ?? ''}`.trim(),
            }
          : null,
      })),
    }
  }

  private baseVisitsQuery(orgId: number) {
    return db
      .from('visits as visit')
      .leftJoin('visit_clients as client', 'client.id', 'visit.client_id')
      .leftJoin('visit_visitors as visitor', 'visitor.id', 'visit.visitor_id')
      .leftJoin('employees as host', 'host.id', 'visit.host_employee_id')
      .leftJoin('employees as approver', 'approver.id', 'visit.approver_employee_id')
      .leftJoin('employees as creator', 'creator.id', 'visit.created_by')
      .where('visit.org_id', orgId)
      .select(
        'visit.*',
        'client.name as client_name',
        'client.industry as client_industry',
        'client.contact_person as client_contact_person',
        'client.email as client_email',
        'client.phone as client_phone',
        'visitor.full_name as visitor_full_name',
        'visitor.email as visitor_email',
        'visitor.phone as visitor_phone',
        'visitor.designation as visitor_designation',
        'host.first_name',
        'host.last_name',
        'host.email as host_email',
        'approver.first_name as approver_first_name',
        'approver.last_name as approver_last_name',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name'
      )
  }

  private async applyScopedFilters(query: any, employee: AuthEmployee) {
    const scope = await this.getScope(employee)
    if (scope.isElevated) {
      return query
    }

    const allowedIds = [employee.id, ...scope.directReportIds]
    query.where((builder: any) => {
      builder
        .whereIn('visit.created_by', allowedIds)
        .orWhereIn('visit.host_employee_id', allowedIds)
        .orWhereIn('visit.approver_employee_id', allowedIds)
        .orWhereExists((followUpSubQuery: any) => {
          followUpSubQuery
            .from('visit_follow_ups as follow_up')
            .select(db.raw('1'))
            .whereColumn('follow_up.visit_id', 'visit.id')
            .whereIn('follow_up.assigned_to', allowedIds)
        })
    })

    return query
  }

  async getReferenceData(employee: AuthEmployee) {
    const [clients, visitors, employees] = await Promise.all([
      db.from('visit_clients').where('org_id', employee.orgId).orderBy('name', 'asc'),
      db.from('visit_visitors').where('org_id', employee.orgId).orderBy('full_name', 'asc'),
      db.from('employees').where('org_id', employee.orgId).where('status', 'active').orderBy('first_name', 'asc').select('id', 'first_name', 'last_name', 'email', 'role_id', 'manager_id'),
    ])

    return {
      role: {
        id: employee.roleId,
        name: this.roleName(employee.roleId),
      },
      clients: clients.map((client) => ({
        id: Number(client.id),
        name: client.name,
        industry: client.industry,
        contactPerson: client.contact_person,
        email: client.email,
        phone: client.phone,
        address: client.address,
        isActive: Boolean(client.is_active),
      })),
      visitors: visitors.map((visitor) => ({
        id: Number(visitor.id),
        clientId: visitor.client_id ? Number(visitor.client_id) : null,
        fullName: visitor.full_name,
        email: visitor.email,
        phone: visitor.phone,
        designation: visitor.designation,
        address: visitor.address,
        notes: visitor.notes,
        isActive: Boolean(visitor.is_active),
      })),
      employees: employees.map((person) => ({
        id: Number(person.id),
        fullName: `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim(),
        email: person.email,
        roleId: person.role_id ? Number(person.role_id) : null,
        managerId: person.manager_id ? Number(person.manager_id) : null,
      })),
    }
  }

  async listClients(orgId: number) {
    const clients = await db.from('visit_clients').where('org_id', orgId).orderBy('name', 'asc')
    return clients.map((client) => ({
      id: Number(client.id),
      name: client.name,
      industry: client.industry,
      contactPerson: client.contact_person,
      email: client.email,
      phone: client.phone,
      address: client.address,
      isActive: Boolean(client.is_active),
    }))
  }

  async createClient(orgId: number, data: any) {
    const [id] = await db.table('visit_clients').insert({
      org_id: orgId,
      name: data.name,
      industry: data.industry ?? null,
      contact_person: data.contactPerson ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      is_active: data.isActive ?? true,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return (await this.listClients(orgId)).find((client) => client.id === Number(id))
  }

  async updateClient(orgId: number, id: number, data: any) {
    const existing = await db.from('visit_clients').where('org_id', orgId).where('id', id).first()
    if (!existing) {
      throw new Exception('Client not found', { status: 404 })
    }

    await db.from('visit_clients').where('org_id', orgId).where('id', id).update({
      name: data.name ?? existing.name,
      industry: data.industry ?? existing.industry,
      contact_person: data.contactPerson ?? existing.contact_person,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      address: data.address ?? existing.address,
      is_active: data.isActive ?? existing.is_active,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return (await this.listClients(orgId)).find((client) => client.id === Number(id))
  }

  async listVisitors(orgId: number) {
    const visitors = await db
      .from('visit_visitors as visitor')
      .leftJoin('visit_clients as client', 'client.id', 'visitor.client_id')
      .where('visitor.org_id', orgId)
      .orderBy('visitor.full_name', 'asc')
      .select('visitor.*', 'client.name as client_name')

    return visitors.map((visitor) => ({
      id: Number(visitor.id),
      clientId: visitor.client_id ? Number(visitor.client_id) : null,
      clientName: visitor.client_name ?? null,
      fullName: visitor.full_name,
      email: visitor.email,
      phone: visitor.phone,
      designation: visitor.designation,
      address: visitor.address,
      notes: visitor.notes,
      isActive: Boolean(visitor.is_active),
    }))
  }

  async createVisitor(orgId: number, data: any) {
    const [id] = await db.table('visit_visitors').insert({
      org_id: orgId,
      client_id: data.clientId ?? null,
      full_name: data.fullName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      designation: data.designation ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      is_active: data.isActive ?? true,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return (await this.listVisitors(orgId)).find((visitor) => visitor.id === Number(id))
  }

  async updateVisitor(orgId: number, id: number, data: any) {
    const existing = await db.from('visit_visitors').where('org_id', orgId).where('id', id).first()
    if (!existing) {
      throw new Exception('Visitor not found', { status: 404 })
    }

    await db.from('visit_visitors').where('org_id', orgId).where('id', id).update({
      client_id: data.clientId ?? existing.client_id,
      full_name: data.fullName ?? existing.full_name,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      designation: data.designation ?? existing.designation,
      address: data.address ?? existing.address,
      notes: data.notes ?? existing.notes,
      is_active: data.isActive ?? existing.is_active,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return (await this.listVisitors(orgId)).find((visitor) => visitor.id === Number(id))
  }

  async listVisits(employee: AuthEmployee, filters: VisitFilters = {}) {
    const query = this.baseVisitsQuery(employee.orgId)
    await this.applyScopedFilters(query, employee)

    if (filters.status) {
      query.where('visit.status', filters.status)
    }

    if (filters.dateFrom) {
      query.where('visit.scheduled_start', '>=', filters.dateFrom)
    }

    if (filters.dateTo) {
      query.where('visit.scheduled_start', '<=', filters.dateTo)
    }

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`
      query.where((builder: any) => {
        builder
          .whereRaw('LOWER(visit.title) like ?', [term])
          .orWhereRaw('LOWER(visit.purpose) like ?', [term])
          .orWhereRaw('LOWER(visitor.full_name) like ?', [term])
          .orWhereRaw('LOWER(client.name) like ?', [term])
          .orWhereRaw('LOWER(host.first_name) like ?', [term])
      })
    }

    const rows = await query.orderBy('visit.scheduled_start', 'desc')
    return Promise.all(rows.map((row) => this.serializeVisitRow(row)))
  }

  async getVisitDetail(employee: AuthEmployee, visitId: number) {
    await this.ensureVisitAccessible(employee, visitId)
    const row = await this.baseVisitsQuery(employee.orgId).where('visit.id', visitId).first()
    if (!row) {
      throw new Exception('Visit not found', { status: 404 })
    }
    return this.serializeVisitRow(row)
  }

  async createVisit(employee: AuthEmployee, data: any) {
    const requiresApproval = Boolean(data.requiresApproval)
    const status = requiresApproval ? 'pending_approval' : 'planned'
    const [visitId] = await db.table('visits').insert({
      org_id: employee.orgId,
      client_id: data.clientId ?? null,
      visitor_id: data.visitorId ?? null,
      host_employee_id: data.hostEmployeeId ?? null,
      created_by: employee.id,
      approver_employee_id: data.approverEmployeeId ?? null,
      title: data.title,
      purpose: data.purpose,
      location_name: data.locationName ?? null,
      visit_type: data.visitType ?? 'client_meeting',
      priority: data.priority ?? 'medium',
      status,
      requires_approval: requiresApproval,
      scheduled_start: data.scheduledStart,
      scheduled_end: data.scheduledEnd ?? null,
      reminder_at: data.reminderAt ?? null,
      photo_proof_url: data.photoProofUrl ?? null,
      attachment_urls: this.serializeArray(data.attachmentUrls),
      approval_notes: data.approvalNotes ?? null,
      completion_notes: data.completionNotes ?? null,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    if (data.initialNote) {
      await db.table('visit_notes').insert({
        visit_id: visitId,
        org_id: employee.orgId,
        employee_id: employee.id,
        note_type: 'planning',
        content: data.initialNote,
        attachment_urls: this.serializeArray(data.attachmentUrls),
        photo_proof_url: data.photoProofUrl ?? null,
      })
    }

    await this.notifyEmployees(
      employee.orgId,
      requiresApproval ? [data.approverEmployeeId, data.hostEmployeeId] : [data.hostEmployeeId],
      requiresApproval ? 'Visit approval requested' : 'New visit scheduled',
      `${data.title} has been ${requiresApproval ? 'submitted for approval' : 'scheduled'} for ${DateTime.fromISO(data.scheduledStart).toFormat('dd LLL yyyy, hh:mm a')}.`,
      `/visit-management`
    )

    return this.getVisitDetail(employee, Number(visitId))
  }

  async updateVisit(employee: AuthEmployee, visitId: number, data: any) {
    const visit = await this.ensureVisitAccessible(employee, visitId)
    const scope = await this.getScope(employee)
    const canEdit = scope.isElevated || Number(visit.created_by) === employee.id || Number(visit.host_employee_id) === employee.id

    if (!canEdit) {
      throw new Exception('You cannot update this visit', { status: 403 })
    }

    await db.from('visits').where('id', visitId).where('org_id', employee.orgId).update({
      client_id: data.clientId ?? visit.client_id,
      visitor_id: data.visitorId ?? visit.visitor_id,
      host_employee_id: data.hostEmployeeId ?? visit.host_employee_id,
      approver_employee_id: data.approverEmployeeId ?? visit.approver_employee_id,
      title: data.title ?? visit.title,
      purpose: data.purpose ?? visit.purpose,
      location_name: data.locationName ?? visit.location_name,
      visit_type: data.visitType ?? visit.visit_type,
      priority: data.priority ?? visit.priority,
      requires_approval: data.requiresApproval ?? visit.requires_approval,
      scheduled_start: data.scheduledStart ?? visit.scheduled_start,
      scheduled_end: data.scheduledEnd ?? visit.scheduled_end,
      reminder_at: data.reminderAt ?? visit.reminder_at,
      photo_proof_url: data.photoProofUrl ?? visit.photo_proof_url,
      attachment_urls: data.attachmentUrls ? this.serializeArray(data.attachmentUrls) : visit.attachment_urls,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return this.getVisitDetail(employee, visitId)
  }

  async reviewVisit(employee: AuthEmployee, visitId: number, action: 'approve' | 'reject', notes?: string) {
    const visit = await this.ensureVisitAccessible(employee, visitId)
    const scope = await this.getScope(employee)
    const canReview = scope.isElevated || Number(visit.approver_employee_id) === employee.id || (scope.isManager && Number(visit.created_by) !== employee.id)
    if (!canReview) {
      throw new Exception('You cannot review this visit', { status: 403 })
    }

    const nextStatus = action === 'approve' ? 'planned' : 'rejected'
    await db.from('visits').where('id', visitId).where('org_id', employee.orgId).update({
      status: nextStatus,
      approved_by: employee.id,
      approved_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      approval_notes: notes ?? null,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    await this.notifyEmployees(
      employee.orgId,
      [visit.created_by, visit.host_employee_id],
      action === 'approve' ? 'Visit approved' : 'Visit rejected',
      `${visit.title} has been ${action}d by ${this.roleName(employee.roleId)}.`,
      `/visit-management`
    )

    return this.getVisitDetail(employee, visitId)
  }

  async checkIn(employee: AuthEmployee, visitId: number, data: any) {
    const visit = await this.ensureVisitAccessible(employee, visitId)
    if (!['planned', 'in_progress'].includes(visit.status)) {
      throw new Exception('Only planned visits can be checked in', { status: 400 })
    }

    await db.from('visits').where('id', visitId).where('org_id', employee.orgId).update({
      status: 'in_progress',
      actual_check_in_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      check_in_latitude: data.latitude ?? null,
      check_in_longitude: data.longitude ?? null,
      check_in_address: data.address ?? null,
      photo_proof_url: data.photoProofUrl ?? visit.photo_proof_url,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    if (data.note) {
      await db.table('visit_notes').insert({
        visit_id: visitId,
        org_id: employee.orgId,
        employee_id: employee.id,
        note_type: 'check_in',
        content: data.note,
        attachment_urls: this.serializeArray(data.attachmentUrls),
        photo_proof_url: data.photoProofUrl ?? null,
      })
    }

    return this.getVisitDetail(employee, visitId)
  }

  async checkOut(employee: AuthEmployee, visitId: number, data: any) {
    const visit = await this.ensureVisitAccessible(employee, visitId)
    if (!['in_progress', 'planned'].includes(visit.status)) {
      throw new Exception('This visit cannot be checked out', { status: 400 })
    }

    await db.from('visits').where('id', visitId).where('org_id', employee.orgId).update({
      status: 'completed',
      actual_check_out_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      check_out_latitude: data.latitude ?? null,
      check_out_longitude: data.longitude ?? null,
      check_out_address: data.address ?? null,
      completion_notes: data.completionNotes ?? null,
      photo_proof_url: data.photoProofUrl ?? visit.photo_proof_url,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    if (data.note) {
      await db.table('visit_notes').insert({
        visit_id: visitId,
        org_id: employee.orgId,
        employee_id: employee.id,
        note_type: 'check_out',
        content: data.note,
        attachment_urls: this.serializeArray(data.attachmentUrls),
        photo_proof_url: data.photoProofUrl ?? null,
      })
    }

    return this.getVisitDetail(employee, visitId)
  }

  async addNote(employee: AuthEmployee, visitId: number, data: any) {
    await this.ensureVisitAccessible(employee, visitId)
    const [id] = await db.table('visit_notes').insert({
      visit_id: visitId,
      org_id: employee.orgId,
      employee_id: employee.id,
      note_type: data.noteType ?? 'general',
      content: data.content,
      attachment_urls: this.serializeArray(data.attachmentUrls),
      photo_proof_url: data.photoProofUrl ?? null,
    })

    return db.from('visit_notes').where('id', id).first()
  }

  async createFollowUp(employee: AuthEmployee, visitId: number, data: any) {
    await this.ensureVisitAccessible(employee, visitId)
    const [id] = await db.table('visit_follow_ups').insert({
      visit_id: visitId,
      org_id: employee.orgId,
      assigned_to: data.assignedTo ?? null,
      created_by: employee.id,
      status: data.status ?? 'open',
      priority: data.priority ?? 'medium',
      title: data.title,
      description: data.description ?? null,
      due_at: data.dueAt ?? null,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    await this.notifyEmployees(
      employee.orgId,
      [data.assignedTo],
      'Visit follow-up assigned',
      `${data.title} has been assigned as a visit follow-up.`,
      '/visit-management'
    )

    return db.from('visit_follow_ups').where('id', id).first()
  }

  async updateFollowUp(employee: AuthEmployee, followUpId: number, data: any) {
    const followUp = await db.from('visit_follow_ups').where('id', followUpId).where('org_id', employee.orgId).first()
    if (!followUp) {
      throw new Exception('Follow-up not found', { status: 404 })
    }

    const scope = await this.getScope(employee)
    const canEdit = scope.isElevated || Number(followUp.assigned_to) === employee.id || Number(followUp.created_by) === employee.id
    if (!canEdit) {
      throw new Exception('You cannot update this follow-up', { status: 403 })
    }

    const nextStatus = data.status ?? followUp.status
    await db.from('visit_follow_ups').where('id', followUpId).where('org_id', employee.orgId).update({
      assigned_to: data.assignedTo ?? followUp.assigned_to,
      status: nextStatus,
      priority: data.priority ?? followUp.priority,
      title: data.title ?? followUp.title,
      description: data.description ?? followUp.description,
      due_at: data.dueAt ?? followUp.due_at,
      completed_at: nextStatus === 'completed' ? DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss') : null,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return db.from('visit_follow_ups').where('id', followUpId).first()
  }

  async getDashboard(employee: AuthEmployee) {
    const visits = await this.listVisits(employee)
    const todayStart = DateTime.now().startOf('day')
    const todayEnd = DateTime.now().endOf('day')
    const nowMillis = DateTime.now().toMillis()
    const allFollowUps = visits.flatMap((visit) => visit.followUps.map((followUp: any) => ({ ...followUp, visitId: visit.id, visitTitle: visit.title })))

    const statusBreakdown = ['pending_approval', 'planned', 'in_progress', 'completed', 'rejected'].map((status) => ({
      status,
      count: visits.filter((visit) => visit.status === status).length,
    }))

    const byHostMap = new Map<string, number>()
    visits.forEach((visit) => {
      const hostName = visit.host?.name || 'Unassigned'
      byHostMap.set(hostName, (byHostMap.get(hostName) || 0) + 1)
    })

    return {
      summary: {
        total: visits.length,
        planned: visits.filter((visit) => visit.status === 'planned').length,
        inProgress: visits.filter((visit) => visit.status === 'in_progress').length,
        completed: visits.filter((visit) => visit.status === 'completed').length,
        pendingApproval: visits.filter((visit) => visit.status === 'pending_approval').length,
        todaysVisits: visits.filter((visit) => {
          const timestamp = DateTime.fromISO(visit.scheduledStart).toMillis()
          return timestamp >= todayStart.toMillis() && timestamp <= todayEnd.toMillis()
        }).length,
        overdueFollowUps: allFollowUps.filter((followUp) => followUp.status !== 'completed' && followUp.dueAt && DateTime.fromISO(followUp.dueAt).toMillis() < nowMillis).length,
        upcomingReminders: visits.filter((visit) => visit.reminderAt && DateTime.fromISO(visit.reminderAt).toMillis() >= nowMillis).length,
      },
      statusBreakdown,
      hostBreakdown: Array.from(byHostMap.entries()).map(([hostName, count]) => ({ hostName, count })).sort((left, right) => right.count - left.count).slice(0, 5),
      upcomingVisits: visits
        .filter((visit) => ['pending_approval', 'planned', 'in_progress'].includes(visit.status))
        .sort((left, right) => DateTime.fromISO(left.scheduledStart).toMillis() - DateTime.fromISO(right.scheduledStart).toMillis())
        .slice(0, 6),
      dueFollowUps: allFollowUps
        .filter((followUp) => followUp.status !== 'completed')
        .sort((left, right) => DateTime.fromISO(left.dueAt || DateTime.now().toISO()!).toMillis() - DateTime.fromISO(right.dueAt || DateTime.now().toISO()!).toMillis())
        .slice(0, 8),
      recentActivity: visits
        .flatMap((visit) => visit.notes.slice(0, 2).map((note: any) => ({
          visitId: visit.id,
          visitTitle: visit.title,
          noteType: note.noteType,
          content: note.content,
          createdAt: note.createdAt,
          employee: note.employee,
        })))
        .sort((left, right) => DateTime.fromISO(right.createdAt).toMillis() - DateTime.fromISO(left.createdAt).toMillis())
        .slice(0, 8),
    }
  }

  async getReports(employee: AuthEmployee, filters: VisitFilters = {}) {
    const visits = await this.listVisits(employee, filters)
    const completed = visits.filter((visit) => visit.status === 'completed')
    const averageVisitHours = completed.length
      ? Math.round(
          (completed.reduce((total, visit) => {
            if (!visit.actualCheckInAt || !visit.actualCheckOutAt) {
              return total
            }
            const diff = DateTime.fromISO(visit.actualCheckOutAt).diff(DateTime.fromISO(visit.actualCheckInAt), 'hours').hours
            return total + (diff || 0)
          }, 0) / completed.length) * 10
        ) / 10
      : 0

    const clientMap = new Map<string, number>()
    visits.forEach((visit) => {
      const key = visit.client?.name || 'Direct / Internal'
      clientMap.set(key, (clientMap.get(key) || 0) + 1)
    })

    return {
      summary: {
        totalVisits: visits.length,
        completedVisits: completed.length,
        approvalPending: visits.filter((visit) => visit.status === 'pending_approval').length,
        averageVisitHours,
      },
      visits,
      byClient: Array.from(clientMap.entries()).map(([clientName, count]) => ({ clientName, count })).sort((left, right) => right.count - left.count),
    }
  }
}
