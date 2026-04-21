import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import Employee from '#models/employee'

type AuthEmployee = {
  id: number
  orgId: number
  roleId: number | null
}

export default class EmployeeSelfServiceService {
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
    let query = db.from('ess_requests').where('org_id', employee.orgId).where('employee_id', employee.id)

    if (filters.type) query = query.where('request_type', filters.type)
    if (filters.status) query = query.where('status', filters.status)

    const rows = await query.orderBy('created_at', 'desc')
    return rows.map((row) => ({
      id: Number(row.id),
      requestType: row.request_type,
      title: row.title,
      description: row.description,
      requestDate: row.request_date,
      startDate: row.start_date,
      endDate: row.end_date,
      amount: row.amount ? Number(row.amount) : null,
      status: row.status,
      attachmentUrl: row.attachment_url,
      meta: row.meta ? JSON.parse(row.meta) : {},
      resolutionNote: row.resolution_note,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
    }))
  }

  async createRequest(employee: AuthEmployee, payload: any) {
    const [id] = await db.table('ess_requests').insert({
      org_id: employee.orgId,
      employee_id: employee.id,
      approver_employee_id: payload.approverEmployeeId ?? null,
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
