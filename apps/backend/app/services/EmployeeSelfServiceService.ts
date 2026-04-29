import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import Employee from '#models/employee'

type AuthEmployee = {
  id: number
  orgId: number
  roleId: number | null
  managerId?: number | null
}

export default class EmployeeSelfServiceService {
  private readonly elevatedRoleIds = new Set([1, 2, 3])
  private readonly managerRoleId = 4

  private isElevatedRoleName(roleName: string) {
    const normalized = String(roleName || '').trim().toLowerCase()
    return (
      normalized === 'super admin' ||
      normalized.includes('organization admin') ||
      normalized === 'admin' ||
      normalized.includes('admin') ||
      normalized.includes('hr manager') ||
      normalized.includes('hr admin') ||
      normalized.includes('human resource')
    )
  }

  private isManagerRoleName(roleName: string) {
    const normalized = String(roleName || '').trim().toLowerCase()
    return normalized === 'manager' || (normalized.includes('manager') && !normalized.includes('hr manager'))
  }

  private parseMeta(value: unknown) {
    if (!value) return {}
    if (typeof value === 'object') return value as Record<string, any>

    try {
      return JSON.parse(String(value))
    } catch {
      return {}
    }
  }

  private async getDirectReportIds(employeeId: number, orgId: number) {
    const rows = await db.from('employees').where('org_id', orgId).where('manager_id', employeeId).select('id')
    return rows.map((row) => Number(row.id))
  }

  private async resolveApproverEmployeeId(employee: AuthEmployee, requestedApproverId?: number | null) {
    const explicitApproverId = Number(requestedApproverId ?? 0)
    if (Number.isFinite(explicitApproverId) && explicitApproverId > 0) {
      return explicitApproverId
    }

    const authManagerId = Number(employee.managerId ?? 0)
    if (Number.isFinite(authManagerId) && authManagerId > 0) {
      return authManagerId
    }

    const employeeRow = await db
      .from('employees')
      .where('org_id', employee.orgId)
      .where('id', employee.id)
      .select('manager_id')
      .first()

    const persistedManagerId = Number(employeeRow?.manager_id ?? 0)
    return Number.isFinite(persistedManagerId) && persistedManagerId > 0 ? persistedManagerId : null
  }

  private async resolveFallbackApproverForRequester(requesterEmployeeId: number, orgId: number) {
    const requester = await db
      .from('employees')
      .where('org_id', orgId)
      .where('id', requesterEmployeeId)
      .select('id', 'manager_id')
      .first()

    const managerId = Number(requester?.manager_id ?? 0)
    if (Number.isFinite(managerId) && managerId > 0 && managerId !== requesterEmployeeId) {
      return managerId
    }

    const fallbackApprover = await db
      .from('employees')
      .where('org_id', orgId)
      .whereNot('id', requesterEmployeeId)
      .whereIn('role_id', [2, 3, 4])
      .where('status', 'active')
      .orderByRaw('CASE WHEN role_id = 2 THEN 1 WHEN role_id = 3 THEN 2 WHEN role_id = 4 THEN 3 ELSE 4 END')
      .orderBy('id', 'asc')
      .select('id')
      .first()

    const approverId = Number(fallbackApprover?.id ?? 0)
    return Number.isFinite(approverId) && approverId > 0 ? approverId : null
  }

  private async assignMissingApprovers(orgId: number) {
    const orphanRequests = await db
      .from('ess_requests')
      .where('org_id', orgId)
      .whereIn('status', ['pending', 'sent_back'])
      .whereNull('approver_employee_id')
      .select('id', 'employee_id')

    for (const request of orphanRequests) {
      const approverId = await this.resolveFallbackApproverForRequester(
        Number(request.employee_id),
        orgId
      )

      if (!approverId) {
        continue
      }

      await db
        .from('ess_requests')
        .where('org_id', orgId)
        .where('id', Number(request.id))
        .whereNull('approver_employee_id')
        .update({
          approver_employee_id: approverId,
          updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        })
    }
  }

  private async getApprovalScope(employee: AuthEmployee) {
    const employeeRow = await db
      .from('employees as employee')
      .leftJoin('roles as role', 'role.id', 'employee.role_id')
      .where('employee.org_id', employee.orgId)
      .where('employee.id', employee.id)
      .select('employee.role_id', 'employee.manager_id', 'role.role_name')
      .first()

    const resolvedRoleId = Number(employee.roleId ?? employeeRow?.role_id ?? 0)
    const resolvedRoleName = String(employeeRow?.role_name ?? '').trim()
    const isElevated =
      this.elevatedRoleIds.has(resolvedRoleId) || this.isElevatedRoleName(resolvedRoleName)
    const isManager =
      resolvedRoleId === this.managerRoleId || this.isManagerRoleName(resolvedRoleName)
    const directReportIds = isManager ? await this.getDirectReportIds(employee.id, employee.orgId) : []
    const hasAssignedApprovals = Boolean(
      await db
        .from('ess_requests')
        .where('org_id', employee.orgId)
        .where('approver_employee_id', employee.id)
        .whereIn('status', ['pending', 'sent_back'])
        .first()
    )

    return {
      isElevated,
      isManager,
      directReportIds,
      hasAssignedApprovals,
    }
  }

  private mapRequestRow(row: any) {
    const meta = this.parseMeta(row.meta)
    const reason = typeof meta.reason === 'string' ? meta.reason : null
    const timeline = [
      {
        id: Number(row.id) * 10 + 1,
        action: row.status === 'draft' ? 'created' : 'submitted',
        actorId: row.employee_id ? Number(row.employee_id) : null,
        actorName: `${row.employee_first_name ?? ''} ${row.employee_last_name ?? ''}`.trim() || null,
        note: row.status === 'draft' ? 'Request saved as draft.' : 'Request submitted for approval.',
        createdAt: row.created_at,
      },
    ]

    if (row.status && ['approved', 'rejected', 'cancelled', 'sent_back'].includes(String(row.status))) {
      timeline.push({
        id: Number(row.id) * 10 + 2,
        action: row.status,
        actorId: row.approver_employee_id ? Number(row.approver_employee_id) : null,
        actorName: `${row.approver_first_name ?? ''} ${row.approver_last_name ?? ''}`.trim() || null,
        note: row.resolution_note ?? null,
        createdAt: row.resolved_at ?? row.updated_at ?? row.created_at,
      })
    }

    return {
      id: Number(row.id),
      orgId: Number(row.org_id),
      employeeId: Number(row.employee_id),
      employeeName: `${row.employee_first_name ?? ''} ${row.employee_last_name ?? ''}`.trim() || 'Employee',
      employeeCode: row.employee_code ?? null,
      department: row.department_name ?? null,
      designation: row.designation_name ?? null,
      managerId: row.manager_id ? Number(row.manager_id) : null,
      currentApproverId: row.approver_employee_id ? Number(row.approver_employee_id) : null,
      approverIds: row.approver_employee_id ? [Number(row.approver_employee_id)] : [],
      requestType: row.request_type,
      title: row.title,
      reason: reason ?? row.title,
      description: row.description,
      requestDate: row.request_date,
      startDate: row.start_date,
      endDate: row.end_date,
      amount: row.amount ? Number(row.amount) : null,
      status: row.status,
      attachmentUrl: row.attachment_url,
      meta,
      resolutionNote: row.resolution_note,
      approvalComment: row.resolution_note,
      rejectionReason: row.status === 'rejected' ? row.resolution_note : null,
      sentBackReason: row.status === 'sent_back' ? row.resolution_note : null,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? row.created_at,
      timeline,
    }
  }

  private baseRequestQuery(orgId: number) {
    return db
      .from('ess_requests as request')
      .leftJoin('employees as employee', 'employee.id', 'request.employee_id')
      .leftJoin('employees as approver', 'approver.id', 'request.approver_employee_id')
      .leftJoin('departments as department', 'department.id', 'employee.department_id')
      .leftJoin('designations as designation', 'designation.id', 'employee.designation_id')
      .where('request.org_id', orgId)
      .select(
        'request.*',
        'employee.first_name as employee_first_name',
        'employee.last_name as employee_last_name',
        'employee.employee_code',
        'employee.manager_id',
        'department.department_name as department_name',
        'designation.designation_name as designation_name',
        'approver.first_name as approver_first_name',
        'approver.last_name as approver_last_name'
      )
  }

  async getDashboard(employee: AuthEmployee) {
    const today = DateTime.now()
    const startOfMonth = today.startOf('month').toISODate()!
    const endOfMonth = today.endOf('month').toISODate()!

    const [attendanceRows, leaveRows, requestRows, payrollRows, notifications, holidays, documents] = await Promise.all([
      db.from('attendances').where('employee_id', employee.id).whereBetween('attendance_date', [startOfMonth, endOfMonth]),
      db.from('leaves').where('employee_id', employee.id).orderBy('created_at', 'desc'),
      db.from('ess_requests').where('employee_id', employee.id).where('org_id', employee.orgId).orderBy('created_at', 'desc'),
      db.from('payroll').where('employee_id', employee.id).where('org_id', employee.orgId).orderBy([{ column: 'year', order: 'desc' }, { column: 'month', order: 'desc' }]),
      db.from('notifications').where('employee_id', employee.id).orderBy('created_at', 'desc').limit(8),
      db.from('holidays').where('org_id', employee.orgId).where('date', '>=', today.toISODate()!).orderBy('date', 'asc').limit(6),
      db.from('documents').where('employee_id', employee.id).where('org_id', employee.orgId).orderBy('created_at', 'desc').limit(8),
    ])

    return {
      summary: {
        presentDays: attendanceRows.filter((row) => row.status === 'present').length,
        lateDays: attendanceRows.filter((row) => row.status === 'late').length,
        leaveCount: leaveRows.filter((row) => row.status === 'approved').length,
        pendingRequests: requestRows.filter((row) => row.status === 'pending').length,
        latestNetSalary: Number(payrollRows[0]?.net_salary || 0),
        unreadNotifications: notifications.filter((row) => !row.is_read).length,
        documents: documents.length,
      },
      upcomingHolidays: holidays.map((item) => ({
        id: Number(item.id),
        name: item.name,
        date: item.date,
        isOptional: Boolean(item.is_optional),
      })),
      recentNotifications: notifications.map((item) => ({
        id: Number(item.id),
        title: item.title,
        message: item.message,
        type: item.type,
        isRead: Boolean(item.is_read),
        createdAt: item.created_at,
      })),
      requestBreakdown: ['leave', 'wfh', 'attendance_correction', 'expense_claim', 'travel_request', 'gate_pass'].map((type) => ({
        type,
        count: requestRows.filter((row) => row.request_type === type).length,
      })),
    }
  }

  async listRequests(employee: AuthEmployee, filters: { type?: string; status?: string }) {
    await this.assignMissingApprovers(employee.orgId)

    let query = this.baseRequestQuery(employee.orgId).where('request.employee_id', employee.id)

    if (filters.type) query = query.where('request.request_type', filters.type)
    if (filters.status) query = query.where('request.status', filters.status)

    const rows = await query.orderBy('request.created_at', 'desc')
    return rows.map((row) => this.mapRequestRow(row))
  }

  async createRequest(employee: AuthEmployee, payload: any) {
    const approverEmployeeId = await this.resolveApproverEmployeeId(employee, payload.approverEmployeeId)

    const [id] = await db.table('ess_requests').insert({
      org_id: employee.orgId,
      employee_id: employee.id,
      approver_employee_id: approverEmployeeId,
      request_type: payload.requestType,
      title: payload.title,
      description: payload.description ?? null,
      request_date: payload.requestDate ?? null,
      start_date: payload.startDate ?? null,
      end_date: payload.endDate ?? null,
      amount: payload.amount ?? null,
      status: 'pending',
      attachment_url: payload.attachmentUrl ?? null,
      meta: payload.meta ? JSON.stringify(payload.meta) : null,
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return (await this.listRequests(employee, {})).find((item) => item.id === Number(id))
  }

  async listApprovalRequests(
    employee: AuthEmployee,
    filters: {
      type?: string
      status?: string
      employeeId?: number | string
      department?: string
      search?: string
      fromDate?: string
      toDate?: string
    }
  ) {
    await this.assignMissingApprovers(employee.orgId)

    const scope = await this.getApprovalScope(employee)
    if (!scope.isElevated && !scope.isManager && !scope.hasAssignedApprovals) {
      return []
    }

    const query = this.baseRequestQuery(employee.orgId).whereNot('request.employee_id', employee.id)

    if (!scope.isElevated) {
      const allowedIds = scope.directReportIds
      query.where((builder: any) => {
        if (allowedIds.length) {
          builder
            .whereIn('request.employee_id', allowedIds)
            .orWhere('request.approver_employee_id', employee.id)
            .orWhere('employee.manager_id', employee.id)
        } else {
          builder.where('request.approver_employee_id', employee.id).orWhere('employee.manager_id', employee.id)
        }
      })
    }

    if (filters.type) query.where('request.request_type', filters.type)
    if (filters.status) query.where('request.status', filters.status)
    if (filters.employeeId) query.where('request.employee_id', Number(filters.employeeId))
    if (filters.fromDate) query.where('request.created_at', '>=', filters.fromDate)
    if (filters.toDate) query.where('request.created_at', '<=', `${filters.toDate} 23:59:59`)
    if (filters.department) query.whereRaw('LOWER(department.name) like ?', [`%${String(filters.department).toLowerCase()}%`])
    if (filters.search) {
      const term = `%${String(filters.search).toLowerCase()}%`
      query.where((builder: any) => {
        builder
          .whereRaw('LOWER(request.title) like ?', [term])
          .orWhereRaw('LOWER(request.description) like ?', [term])
          .orWhereRaw('LOWER(employee.first_name) like ?', [term])
          .orWhereRaw('LOWER(employee.last_name) like ?', [term])
          .orWhereRaw('LOWER(employee.employee_code) like ?', [term])
      })
    }

    const rows = await query.orderBy('request.created_at', 'desc')
    return rows.map((row) => this.mapRequestRow(row))
  }

  async getApprovalRequest(employee: AuthEmployee, requestId: number) {
    const requests = await this.listApprovalRequests(employee, {})
    return requests.find((item) => item.id === requestId) ?? null
  }

  async processApprovalRequest(
    employee: AuthEmployee,
    requestId: number,
    payload: { action: 'approved' | 'rejected' | 'sent_back'; comment?: string | null }
  ) {
    const request = await this.getApprovalRequest(employee, requestId)
    if (!request) {
      throw new Exception('Request not found', { status: 404 })
    }

    if (!['pending', 'sent_back'].includes(String(request.status))) {
      throw new Exception('Only pending requests can be processed', { status: 400 })
    }

    await db.from('ess_requests').where('id', requestId).where('org_id', employee.orgId).update({
      status: payload.action,
      approver_employee_id: employee.id,
      resolution_note: payload.comment ?? null,
      resolved_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })

    return this.getApprovalRequest(employee, requestId)
  }

  async bulkProcessApprovalRequests(
    employee: AuthEmployee,
    payload: { ids: number[]; action: 'approved' | 'rejected'; comment?: string | null }
  ) {
    const uniqueIds = [...new Set((payload.ids ?? []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))]
    if (!uniqueIds.length) {
      return []
    }

    const allowedRequests = await this.listApprovalRequests(employee, {})
    const allowedIds = new Set(
      allowedRequests
        .filter((item) => uniqueIds.includes(Number(item.id)) && ['pending', 'sent_back'].includes(String(item.status)))
        .map((item) => Number(item.id))
    )

    if (!allowedIds.size) {
      return []
    }

    await db.from('ess_requests')
      .where('org_id', employee.orgId)
      .whereIn('id', [...allowedIds])
      .update({
        status: payload.action,
        approver_employee_id: employee.id,
        resolution_note: payload.comment ?? null,
        resolved_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
        updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      })

    const updatedRequests = await this.listApprovalRequests(employee, {})
    return updatedRequests.filter((item) => allowedIds.has(Number(item.id)))
  }

  async cancelRequest(employee: AuthEmployee, requestId: number) {
    const existing = await db.from('ess_requests').where('id', requestId).where('employee_id', employee.id).where('org_id', employee.orgId).first()
    if (!existing) throw new Exception('Request not found', { status: 404 })
    if (existing.status !== 'pending') throw new Exception('Only pending requests can be cancelled', { status: 400 })

    await db.from('ess_requests').where('id', requestId).update({
      status: 'cancelled',
      resolved_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
      updated_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })
  }

  async getProfileAudit(employee: AuthEmployee) {
    const logs = await db
      .from('audit_logs')
      .where('org_id', employee.orgId)
      .where('module', 'employees')
      .where('entity_id', String(employee.id))
      .orderBy('created_at', 'desc')
      .limit(20)

    return logs.map((log) => ({
      id: Number(log.id),
      action: log.action,
      module: log.module,
      newValues: log.new_values,
      createdAt: log.created_at,
    }))
  }

  async getLoginActivity(employee: AuthEmployee) {
    const logs = await db
      .from('audit_logs')
      .where('org_id', employee.orgId)
      .where('employee_id', employee.id)
      .where('module', 'auth')
      .orderBy('created_at', 'desc')
      .limit(20)

    return logs.map((log) => ({
      id: Number(log.id),
      action: log.action,
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
      countryName: log.country_name,
    }))
  }

  async changePassword(employee: AuthEmployee, payload: { currentPassword: string; newPassword: string }) {
    const record = await Employee.find(employee.id)
    if (!record || record.orgId !== employee.orgId) {
      throw new Exception('Employee not found', { status: 404 })
    }

    const valid = await record.verifyPassword(payload.currentPassword)
    if (!valid) {
      throw new Exception('Current password is incorrect', { status: 400 })
    }

    if (payload.currentPassword === payload.newPassword) {
      throw new Exception('New password must be different from the current password', { status: 400 })
    }

    record.passwordHash = payload.newPassword
    await record.save()
  }
}
