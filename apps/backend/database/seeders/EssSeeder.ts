import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

type EmployeeRow = {
  id: number
  org_id: number
  first_name: string
  last_name: string | null
  role_id: number | null
  manager_id: number | null
  email: string | null
}

export default class extends BaseSeeder {
  private employeeName(employee?: EmployeeRow | null) {
    if (!employee) return 'Team Member'
    return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || 'Team Member'
  }

  private async ensureRequest(orgId: number, employeeId: number, title: string, payload: Record<string, any>) {
    const existing = await db.from('ess_requests').where('org_id', orgId).where('employee_id', employeeId).where('title', title).first()
    const nextPayload = {
      org_id: orgId,
      employee_id: employeeId,
      title,
      ...payload,
      updated_at: DateTime.now().toSQL({ includeOffset: false }),
    }

    if (existing) {
      await db.from('ess_requests').where('id', existing.id).update(nextPayload)
      return Number(existing.id)
    }

    const [id] = await db.table('ess_requests').insert(nextPayload)
    return Number(id)
  }

  private async ensureNotification(employeeId: number, orgId: number, title: string, payload: Record<string, any>) {
    const existing = await db.from('notifications').where('employee_id', employeeId).where('title', title).first()
    const nextPayload = {
      employee_id: employeeId,
      org_id: orgId,
      title,
      ...payload,
    }

    if (existing) {
      await db.from('notifications').where('id', existing.id).update(nextPayload)
      return
    }

    await db.table('notifications').insert(nextPayload)
  }

  private async ensureAuditLog(orgId: number, employeeId: number, module: string, action: string, entityId: string, payload: Record<string, any>) {
    const existing = await db
      .from('audit_logs')
      .where('org_id', orgId)
      .where('employee_id', employeeId)
      .where('module', module)
      .where('action', action)
      .where('entity_id', entityId)
      .first()

    const nextPayload = {
      org_id: orgId,
      employee_id: employeeId,
      module,
      action,
      entity_name: payload.entity_name ?? module,
      entity_id: entityId,
      new_values: payload.new_values ? JSON.stringify(payload.new_values) : null,
      ip_address: payload.ip_address ?? '127.0.0.1',
      user_agent: payload.user_agent ?? 'ESS Seeder',
      created_at: payload.created_at ?? DateTime.now().toSQL({ includeOffset: false }),
    }

    if (existing) {
      await db.from('audit_logs').where('id', existing.id).update(nextPayload)
      return
    }

    await db.table('audit_logs').insert(nextPayload)
  }

  async run() {
    const organizations = await db.from('organizations').select('id', 'company_name').orderBy('id', 'asc')

    for (const organization of organizations) {
      const employees = (await db
        .from('employees')
        .where('org_id', organization.id)
        .where('status', 'active')
        .select('id', 'org_id', 'first_name', 'last_name', 'role_id', 'manager_id', 'email')
        .orderBy('id', 'asc')) as EmployeeRow[]

      if (!employees.length) {
        continue
      }

      const admin = employees.find((employee) => [1, 2, 3].includes(Number(employee.role_id ?? 0))) ?? employees[0]
      const manager = employees.find((employee) => Number(employee.role_id ?? 0) === 4) ?? admin
      const member = employees.find((employee) => Number(employee.role_id ?? 0) === 5) ?? employees[employees.length - 1]
      const now = DateTime.now()

      const pendingRequestId = await this.ensureRequest(organization.id, member.id, 'WFH request for deep work day', {
        approver_employee_id: manager.id,
        request_type: 'wfh',
        description: 'Need uninterrupted time for sprint planning documentation and client follow-ups.',
        request_date: now.plus({ days: 2 }).toISODate(),
        start_date: now.plus({ days: 2 }).toISODate(),
        end_date: now.plus({ days: 2 }).toISODate(),
        status: 'pending',
        meta: JSON.stringify({ channel: 'ess', priority: 'normal' }),
      })

      await this.ensureRequest(organization.id, member.id, 'Attendance correction for missed checkout', {
        approver_employee_id: manager.id,
        request_type: 'attendance_correction',
        description: 'Checkout was missed due to a client escalation. Please regularize 6:42 PM exit.',
        request_date: now.minus({ days: 3 }).toISODate(),
        start_date: now.minus({ days: 3 }).toISODate(),
        end_date: now.minus({ days: 3 }).toISODate(),
        status: 'approved',
        resolution_note: 'Approved after verifying manager confirmation.',
        resolved_at: now.minus({ days: 2, hours: 6 }).toSQL({ includeOffset: false }),
        meta: JSON.stringify({ originalCheckOut: '18:42', channel: 'ess' }),
      })

      await this.ensureRequest(organization.id, member.id, 'Travel request for client onboarding', {
        approver_employee_id: admin.id,
        request_type: 'travel_request',
        description: `Travel approval requested to support onboarding at ${organization.company_name || 'client'} site.`,
        request_date: now.plus({ days: 5 }).toISODate(),
        start_date: now.plus({ days: 5 }).toISODate(),
        end_date: now.plus({ days: 6 }).toISODate(),
        amount: 6500,
        status: 'rejected',
        resolution_note: 'Please use the virtual onboarding format this month.',
        resolved_at: now.minus({ days: 1, hours: 2 }).toSQL({ includeOffset: false }),
        meta: JSON.stringify({ mode: 'train', channel: 'ess' }),
      })

      await this.ensureRequest(organization.id, member.id, 'Gate pass for family medical emergency', {
        approver_employee_id: manager.id,
        request_type: 'gate_pass',
        description: 'Early exit requested for urgent family medical assistance.',
        request_date: now.minus({ days: 6 }).toISODate(),
        start_date: now.minus({ days: 6 }).toISODate(),
        end_date: now.minus({ days: 6 }).toISODate(),
        status: 'cancelled',
        resolved_at: now.minus({ days: 6, hours: 1 }).toSQL({ includeOffset: false }),
        meta: JSON.stringify({ channel: 'ess' }),
      })

      await this.ensureNotification(member.id, organization.id, 'ESS workspace is ready', {
        message: 'Your self-service workspace now includes requests, payroll visibility, documents, and security controls.',
        type: 'info',
        link: '/ess',
        is_read: false,
      })

      await this.ensureNotification(member.id, organization.id, 'WFH request is awaiting review', {
        message: `${this.employeeName(manager)} will review your work-from-home request shortly.`,
        type: 'warning',
        link: '/ess',
        is_read: false,
      })

      await this.ensureAuditLog(organization.id, member.id, 'employees', 'PROFILE_UPDATE', String(member.id), {
        entity_name: 'employees',
        new_values: { emergencyContact: 'Anita Sharma', phone: '+91-9890000000' },
        created_at: now.minus({ days: 2 }).toSQL({ includeOffset: false }),
      })

      await this.ensureAuditLog(organization.id, member.id, 'auth', 'PASSWORD_CHANGE', String(member.id), {
        entity_name: 'employees',
        new_values: { channel: 'ess', outcome: 'success' },
        created_at: now.minus({ hours: 18 }).toSQL({ includeOffset: false }),
        ip_address: '10.10.10.25',
      })

      await this.ensureAuditLog(organization.id, member.id, 'auth', 'LOGIN', String(member.id), {
        entity_name: 'employees',
        new_values: { channel: 'web', session: 'trusted' },
        created_at: now.minus({ hours: 3 }).toSQL({ includeOffset: false }),
        ip_address: '10.10.10.25',
      })

      await this.ensureNotification(
        member.id,
        organization.id,
        'Attendance correction approved',
        {
          message: 'Your attendance correction request has been approved and reflected in the ESS record center.',
          type: 'success',
          link: `/ess`,
          is_read: true,
        }
      )

      await this.ensureAuditLog(organization.id, member.id, 'ess_requests', 'CREATE', String(pendingRequestId), {
        entity_name: 'ess_requests',
        new_values: { requestType: 'wfh', title: 'WFH request for deep work day' },
        created_at: now.minus({ hours: 4 }).toSQL({ includeOffset: false }),
      })
    }
  }
}
