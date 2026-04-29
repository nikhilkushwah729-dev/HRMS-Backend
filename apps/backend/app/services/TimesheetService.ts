import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'

type AuthEmployee = {
  id: number
  orgId: number
  roleId?: number | null
  managerId?: number | null
}

type TimesheetAction = 'approve' | 'reject' | 'send_back' | 'lock'

export default class TimesheetService {
  private readonly elevatedRoleIds = new Set([1, 2, 3])
  private readonly managerRoleId = 4

  private isElevatedRoleName(roleName: string) {
    const normalized = String(roleName || '').trim().toLowerCase()
    return (
      normalized === 'admin' ||
      normalized === 'organization admin' ||
      normalized === 'super admin' ||
      normalized === 'hr manager' ||
      normalized === 'hr'
    )
  }

  private isManagerRoleName(roleName: string) {
    const normalized = String(roleName || '').trim().toLowerCase()
    return normalized === 'manager' || (normalized.includes('manager') && !normalized.includes('hr manager'))
  }

  private async getDirectReportIds(employeeId: number, orgId: number) {
    const rows = await db.from('employees').where('org_id', orgId).where('manager_id', employeeId).select('id')
    return rows.map((row) => Number(row.id)).filter((value) => Number.isFinite(value) && value > 0)
  }

  private parseTime(value?: string | null): { hour: number; minute: number } | null {
    if (!value) return null
    const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/)
    if (!match) return null
    const hour = Number(match[1])
    const minute = Number(match[2])
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
    return { hour, minute }
  }

  private calculateHours(logDate: string, startTime?: string | null, endTime?: string | null, totalHours?: number | null) {
    const numericTotal = Number(totalHours ?? 0)
    const start = this.parseTime(startTime)
    const end = this.parseTime(endTime)

    if (start && end) {
      let startDate = DateTime.fromISO(logDate).set({ hour: start.hour, minute: start.minute, second: 0, millisecond: 0 })
      let endDate = DateTime.fromISO(logDate).set({ hour: end.hour, minute: end.minute, second: 0, millisecond: 0 })
      if (endDate <= startDate) {
        endDate = endDate.plus({ days: 1 })
      }
      const diff = endDate.diff(startDate, 'minutes').minutes
      const hours = Math.round((diff / 60) * 100) / 100
      if (hours <= 0 || hours > 24) {
        throw new Exception('Timesheet hours must be between 0 and 24', { status: 422 })
      }
      return hours
    }

    if (numericTotal > 0 && numericTotal <= 24) {
      return Math.round(numericTotal * 100) / 100
    }

    throw new Exception('Provide valid start and end time or total hours', { status: 422 })
  }

  private normalizeStatus(input?: string | null) {
    const normalized = String(input || 'draft').trim().toLowerCase()
    if (normalized === 'pending') return 'pending'
    if (normalized === 'approved') return 'approved'
    if (normalized === 'rejected') return 'rejected'
    if (normalized === 'sent_back') return 'sent_back'
    if (normalized === 'locked') return 'locked'
    return 'draft'
  }

  private mapRow(row: any, timeline: Array<{ action: string; note: string | null; actorEmployeeId: number | null; actorName: string | null; createdAt: string | null }>) {
    return {
      id: Number(row.id),
      employeeId: Number(row.employee_id),
      employeeName: `${row.employee_first_name ?? ''} ${row.employee_last_name ?? ''}`.trim() || 'Employee',
      employeeCode: row.employee_code ?? null,
      managerId: row.manager_id ? Number(row.manager_id) : null,
      orgId: Number(row.org_id),
      projectId: row.project_id ? Number(row.project_id) : null,
      taskId: row.task_id ? Number(row.task_id) : null,
      projectName: row.project_name ?? null,
      taskName: row.task_title ?? null,
      clientName: row.client_name ?? row.project_client_name ?? null,
      department: row.department_name ?? null,
      designation: row.designation_name ?? null,
      entryMode: row.entry_mode ?? 'daily',
      workDate: row.log_date,
      weekStart: row.week_start ?? null,
      startTime: row.start_time ?? null,
      endTime: row.end_time ?? null,
      totalHours: Number(row.hours_logged ?? 0),
      isBillable: Boolean(row.is_billable),
      status: row.status ?? 'draft',
      description: row.description ?? '',
      submittedAt: row.submitted_at ?? null,
      reviewedAt: row.reviewed_at ?? null,
      reviewNote: row.review_note ?? null,
      approvedBy: row.approved_by ? Number(row.approved_by) : null,
      lockedAt: row.locked_at ?? null,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
      timeline,
    }
  }

  private async getApprovalScope(employee: AuthEmployee) {
    const employeeRow = await db
      .from('employees as employee')
      .leftJoin('roles as role', 'role.id', 'employee.role_id')
      .where('employee.id', employee.id)
      .where('employee.org_id', employee.orgId)
      .select('employee.role_id', 'employee.manager_id', 'role.role_name')
      .first()

    const resolvedRoleId = Number(employee.roleId ?? employeeRow?.role_id ?? 0)
    const resolvedRoleName = String(employeeRow?.role_name ?? '').trim()
    const isElevated = this.elevatedRoleIds.has(resolvedRoleId) || this.isElevatedRoleName(resolvedRoleName)
    const isManager = resolvedRoleId === this.managerRoleId || this.isManagerRoleName(resolvedRoleName)
    const directReportIds = isManager ? await this.getDirectReportIds(employee.id, employee.orgId) : []

    return {
      isElevated,
      isManager,
      directReportIds,
    }
  }

  private async getTimelineMap(timesheetIds: number[]) {
    if (!timesheetIds.length) return new Map<number, any[]>()

    const rows = await db
      .from('timesheet_approval_logs as log')
      .leftJoin('employees as actor', 'actor.id', 'log.actor_employee_id')
      .whereIn('log.timesheet_id', timesheetIds)
      .select(
        'log.timesheet_id',
        'log.action',
        'log.note',
        'log.actor_employee_id',
        'log.created_at',
        'actor.first_name as actor_first_name',
        'actor.last_name as actor_last_name',
      )
      .orderBy('log.created_at', 'asc')

    const map = new Map<number, any[]>()
    for (const row of rows) {
      const list = map.get(Number(row.timesheet_id)) || []
      list.push({
        action: row.action,
        note: row.note ?? null,
        actorEmployeeId: row.actor_employee_id ? Number(row.actor_employee_id) : null,
        actorName: `${row.actor_first_name ?? ''} ${row.actor_last_name ?? ''}`.trim() || null,
        createdAt: row.created_at ?? null,
      })
      map.set(Number(row.timesheet_id), list)
    }
    return map
  }

  private baseQuery(orgId: number) {
    return db
      .from('timesheets as t')
      .leftJoin('projects as p', 'p.id', 't.project_id')
      .leftJoin('tasks as task', 'task.id', 't.task_id')
      .leftJoin('employees as employee', 'employee.id', 't.employee_id')
      .leftJoin('departments as department', 'department.id', 'employee.department_id')
      .leftJoin('designations as designation', 'designation.id', 'employee.designation_id')
      .where('t.org_id', orgId)
      .select(
        't.*',
        'p.name as project_name',
        'p.client_name as project_client_name',
        'task.title as task_title',
        'employee.first_name as employee_first_name',
        'employee.last_name as employee_last_name',
        'employee.employee_code',
        'employee.manager_id',
        'department.department_name as department_name',
        'designation.designation_name as designation_name',
      )
  }

  private async appendAudit(timesheetId: number, orgId: number, employeeId: number, actorEmployeeId: number | null, action: string, note?: string | null) {
    await db.table('timesheet_approval_logs').insert({
      timesheet_id: timesheetId,
      org_id: orgId,
      employee_id: employeeId,
      actor_employee_id: actorEmployeeId,
      action,
      note: note ?? null,
      created_at: DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss'),
    })
  }

  async listSelf(employeeId: number, orgId: number, filters: Record<string, any> = {}) {
    let query = this.baseQuery(orgId)
    query = query.where('t.employee_id', employeeId)

    if (filters.status) query.where('t.status', String(filters.status))
    if (filters.startDate) query.where('t.log_date', '>=', filters.startDate)
    if (filters.endDate) query.where('t.log_date', '<=', filters.endDate)

    const rows: any[] = await query.orderBy('t.log_date', 'desc').orderBy('t.id', 'desc')
    const timelineMap = await this.getTimelineMap(rows.map((row: any) => Number(row.id)))
    return rows.map((row: any) => this.mapRow(row, timelineMap.get(Number(row.id)) || []))
  }

  async listForApproval(employee: AuthEmployee, filters: Record<string, any> = {}) {
    const scope = await this.getApprovalScope(employee)
    if (!scope.isElevated && !scope.isManager) {
      return []
    }

    let query = this.baseQuery(employee.orgId)

    if (!scope.isElevated) {
      query = query.where((builder: any) => {
        builder.where('employee.manager_id', employee.id)
        if (scope.directReportIds.length) {
          builder.orWhereIn('t.employee_id', scope.directReportIds)
        }
      })
    }

    if (filters.status) query.where('t.status', String(filters.status))
    if (filters.employeeId) query.where('t.employee_id', Number(filters.employeeId))
    if (filters.projectId) query.where('t.project_id', Number(filters.projectId))
    if (filters.clientName) query.whereILike('t.client_name', `%${String(filters.clientName).trim()}%`)
    if (filters.department) query.whereILike('department.department_name', `%${String(filters.department).trim()}%`)
    if (filters.startDate) query.where('t.log_date', '>=', filters.startDate)
    if (filters.endDate) query.where('t.log_date', '<=', filters.endDate)

    const rows: any[] = await query.orderBy('t.log_date', 'desc').orderBy('t.id', 'desc')
    const timelineMap = await this.getTimelineMap(rows.map((row: any) => Number(row.id)))
    return rows.map((row: any) => this.mapRow(row, timelineMap.get(Number(row.id)) || []))
  }

  async getById(id: number, employee: AuthEmployee, adminMode = false) {
    const rows = adminMode
      ? await this.listForApproval(employee)
      : await this.listSelf(employee.id, employee.orgId)

    const record = rows.find((item: any) => item.id === Number(id))
    if (!record) {
      throw new Exception('Timesheet not found', { status: 404 })
    }
    return record
  }

  async create(employeeId: number, orgId: number, data: any) {
    const logDate = String(data.workDate ?? data.log_date ?? DateTime.now().toISODate())
    const startTime = data.startTime ?? data.start_time ?? null
    const endTime = data.endTime ?? data.end_time ?? null
    const totalHours = this.calculateHours(logDate, startTime, endTime, data.totalHours ?? data.hoursWorked ?? data.hours_logged)
    const status = this.normalizeStatus(data.status)
    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')

    const inserted = await db.table('timesheets').insert({
      employee_id: employeeId,
      org_id: orgId,
      project_id: data.projectId ?? data.project_id ?? null,
      task_id: data.taskId ?? data.task_id ?? null,
      entry_mode: data.entryMode ?? data.entry_mode ?? 'daily',
      client_name: data.clientName ?? data.client_name ?? null,
      log_date: logDate,
      start_time: startTime,
      end_time: endTime,
      hours_logged: totalHours,
      is_billable: Boolean(data.isBillable ?? data.is_billable ?? false),
      status,
      week_start: data.weekStart ?? data.week_start ?? null,
      submitted_at: status === 'pending' ? now : null,
      description: data.description ?? null,
      created_at: now,
      updated_at: now,
    })

    const insertedId = Array.isArray(inserted) ? inserted[0] : inserted
    await this.appendAudit(Number(insertedId), orgId, employeeId, employeeId, status === 'pending' ? 'submitted' : 'draft_saved', data.description ?? null)
    return this.getById(Number(insertedId), { id: employeeId, orgId }, false)
  }

  async update(id: number, employee: AuthEmployee, data: any) {
    const existing = await db.from('timesheets').where('id', id).where('org_id', employee.orgId).first()
    if (!existing || Number(existing.employee_id) !== employee.id) {
      throw new Exception('Timesheet not found', { status: 404 })
    }
    if (['approved', 'locked'].includes(String(existing.status))) {
      throw new Exception('Approved timesheets are locked', { status: 400 })
    }

    const logDate = String(data.workDate ?? data.log_date ?? existing.log_date)
    const startTime = data.startTime ?? data.start_time ?? existing.start_time ?? null
    const endTime = data.endTime ?? data.end_time ?? existing.end_time ?? null
    const totalHours = this.calculateHours(logDate, startTime, endTime, data.totalHours ?? data.hoursWorked ?? data.hours_logged ?? existing.hours_logged)
    const status = this.normalizeStatus(data.status ?? existing.status)
    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')

    await db.from('timesheets').where('id', id).update({
      project_id: data.projectId ?? data.project_id ?? existing.project_id ?? null,
      task_id: data.taskId ?? data.task_id ?? existing.task_id ?? null,
      entry_mode: data.entryMode ?? data.entry_mode ?? existing.entry_mode ?? 'daily',
      client_name: data.clientName ?? data.client_name ?? existing.client_name ?? null,
      log_date: logDate,
      start_time: startTime,
      end_time: endTime,
      hours_logged: totalHours,
      is_billable: Boolean(data.isBillable ?? data.is_billable ?? existing.is_billable ?? false),
      status,
      week_start: data.weekStart ?? data.week_start ?? existing.week_start ?? null,
      submitted_at: status === 'pending' ? (existing.submitted_at ?? now) : null,
      description: data.description ?? existing.description ?? null,
      updated_at: now,
      reviewed_at: ['rejected', 'sent_back'].includes(String(existing.status)) ? null : existing.reviewed_at ?? null,
      approved_by: ['rejected', 'sent_back'].includes(String(existing.status)) ? null : existing.approved_by ?? null,
      review_note: ['rejected', 'sent_back'].includes(String(existing.status)) ? null : existing.review_note ?? null,
      locked_at: status === 'locked' ? existing.locked_at ?? now : null,
    })

    await this.appendAudit(id, employee.orgId, employee.id, employee.id, status === 'pending' ? 'resubmitted' : 'updated', data.description ?? null)
    return this.getById(id, employee, false)
  }

  async submit(id: number, employee: AuthEmployee) {
    const existing = await db.from('timesheets').where('id', id).where('org_id', employee.orgId).first()
    if (!existing || Number(existing.employee_id) !== employee.id) {
      throw new Exception('Timesheet not found', { status: 404 })
    }
    if (['approved', 'locked'].includes(String(existing.status))) {
      throw new Exception('Approved timesheets are locked', { status: 400 })
    }

    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    await db.from('timesheets').where('id', id).update({
      status: 'pending',
      submitted_at: now,
      updated_at: now,
    })
    await this.appendAudit(id, employee.orgId, employee.id, employee.id, 'submitted', 'Timesheet submitted for approval')
    return this.getById(id, employee, false)
  }

  async review(id: number, employee: AuthEmployee, action: TimesheetAction, note?: string | null) {
    const scope = await this.getApprovalScope(employee)
    if (!scope.isElevated && !scope.isManager) {
      throw new Exception('You are not allowed to review timesheets', { status: 403 })
    }

    const existing = await db.from('timesheets').where('id', id).where('org_id', employee.orgId).first()
    if (!existing) {
      throw new Exception('Timesheet not found', { status: 404 })
    }

    if (!scope.isElevated) {
      const directReportIds = new Set(scope.directReportIds)
      const employeeId = Number(existing.employee_id)
      if (!directReportIds.has(employeeId)) {
        const reporter = await db.from('employees').where('id', employeeId).select('manager_id').first()
        if (Number(reporter?.manager_id ?? 0) !== employee.id) {
          throw new Exception('You can review only your team timesheets', { status: 403 })
        }
      }
    }

    const now = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')
    const updatePayload: Record<string, any> = {
      reviewed_at: now,
      approved_by: employee.id,
      review_note: note ?? null,
      updated_at: now,
    }

    if (action === 'approve') {
      updatePayload.status = 'approved'
      updatePayload.locked_at = null
    } else if (action === 'reject') {
      updatePayload.status = 'rejected'
      updatePayload.locked_at = null
    } else if (action === 'send_back') {
      updatePayload.status = 'sent_back'
      updatePayload.locked_at = null
    } else if (action === 'lock') {
      updatePayload.status = 'locked'
      updatePayload.locked_at = now
    }

    await db.from('timesheets').where('id', id).update(updatePayload)
    await this.appendAudit(id, employee.orgId, Number(existing.employee_id), employee.id, action, note ?? null)
    return this.getById(id, employee, true)
  }

  async bulkReview(employee: AuthEmployee, ids: number[], action: Exclude<TimesheetAction, 'lock'>, note?: string | null) {
    const results: any[] = []
    for (const id of ids) {
      try {
        const result = await this.review(id, employee, action, note)
        results.push({ id, success: true, result })
      } catch (error: any) {
        results.push({ id, success: false, message: error?.message || 'Failed' })
      }
    }
    return results
  }

  async reports(employee: AuthEmployee, filters: Record<string, any> = {}) {
    const rows = await this.listForApproval(employee, filters)
    const totalHours = rows.reduce((sum: number, row: any) => sum + Number(row.totalHours || 0), 0)
    const billableHours = rows
      .filter((row: any) => row.isBillable)
      .reduce((sum: number, row: any) => sum + Number(row.totalHours || 0), 0)
    const nonBillableHours = totalHours - billableHours

    const byProjectMap = new Map<string, { projectName: string; hours: number; billableHours: number; nonBillableHours: number }>()
    const byEmployeeMap = new Map<string, { employeeName: string; employeeCode: string | null; hours: number; billableHours: number; nonBillableHours: number }>()

    for (const row of rows) {
      const projectKey = row.projectName || 'Unassigned'
      const projectBucket = byProjectMap.get(projectKey) || { projectName: projectKey, hours: 0, billableHours: 0, nonBillableHours: 0 }
      projectBucket.hours += Number(row.totalHours || 0)
      if (row.isBillable) projectBucket.billableHours += Number(row.totalHours || 0)
      else projectBucket.nonBillableHours += Number(row.totalHours || 0)
      byProjectMap.set(projectKey, projectBucket)

      const employeeKey = `${row.employeeId}`
      const employeeBucket = byEmployeeMap.get(employeeKey) || { employeeName: row.employeeName, employeeCode: row.employeeCode, hours: 0, billableHours: 0, nonBillableHours: 0 }
      employeeBucket.hours += Number(row.totalHours || 0)
      if (row.isBillable) employeeBucket.billableHours += Number(row.totalHours || 0)
      else employeeBucket.nonBillableHours += Number(row.totalHours || 0)
      byEmployeeMap.set(employeeKey, employeeBucket)
    }

    return {
      summary: {
        totalEntries: rows.length,
        totalHours,
        billableHours,
        nonBillableHours,
        approvedEntries: rows.filter((row: any) => row.status === 'approved' || row.status === 'locked').length,
        pendingEntries: rows.filter((row: any) => row.status === 'pending').length,
      },
      byProject: Array.from(byProjectMap.values()).sort((a, b) => b.hours - a.hours),
      byEmployee: Array.from(byEmployeeMap.values()).sort((a, b) => b.hours - a.hours),
      entries: rows,
    }
  }
}
