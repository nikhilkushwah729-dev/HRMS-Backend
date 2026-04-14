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
}

export default class extends BaseSeeder {
  private employeeName(employee?: EmployeeRow | null) {
    if (!employee) return 'Team Member'
    return `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim() || 'Team Member'
  }

  private async ensureClient(orgId: number, payload: any) {
    const existing = await db.from('visit_clients').where('org_id', orgId).where('name', payload.name).first()
    if (existing) {
      await db.from('visit_clients').where('id', existing.id).update({
        ...payload,
        org_id: orgId,
        updated_at: DateTime.now().toSQL(),
      })
      return Number(existing.id)
    }

    const [id] = await db.table('visit_clients').insert({
      org_id: orgId,
      ...payload,
      updated_at: DateTime.now().toSQL(),
    })
    return Number(id)
  }

  private async ensureVisitor(orgId: number, payload: any) {
    const existing = await db.from('visit_visitors').where('org_id', orgId).where('full_name', payload.full_name).first()
    if (existing) {
      await db.from('visit_visitors').where('id', existing.id).update({
        ...payload,
        org_id: orgId,
        updated_at: DateTime.now().toSQL(),
      })
      return Number(existing.id)
    }

    const [id] = await db.table('visit_visitors').insert({
      org_id: orgId,
      ...payload,
      updated_at: DateTime.now().toSQL(),
    })
    return Number(id)
  }

  private async ensureVisit(orgId: number, title: string, payload: any) {
    const existing = await db.from('visits').where('org_id', orgId).where('title', title).first()
    if (existing) {
      await db.from('visits').where('id', existing.id).update({
        ...payload,
        org_id: orgId,
        updated_at: DateTime.now().toSQL(),
      })
      return Number(existing.id)
    }

    const [id] = await db.table('visits').insert({
      org_id: orgId,
      title,
      ...payload,
      updated_at: DateTime.now().toSQL(),
    })
    return Number(id)
  }

  private async ensureNote(visitId: number, orgId: number, employeeId: number | null, noteType: string, content: string) {
    const existing = await db.from('visit_notes').where('visit_id', visitId).where('note_type', noteType).where('content', content).first()
    if (existing) return

    await db.table('visit_notes').insert({
      visit_id: visitId,
      org_id: orgId,
      employee_id: employeeId,
      note_type: noteType,
      content,
    })
  }

  private async ensureFollowUp(visitId: number, orgId: number, payload: any) {
    const existing = await db.from('visit_follow_ups').where('visit_id', visitId).where('title', payload.title).first()
    if (existing) {
      await db.from('visit_follow_ups').where('id', existing.id).update({
        ...payload,
        org_id: orgId,
        updated_at: DateTime.now().toSQL(),
      })
      return
    }

    await db.table('visit_follow_ups').insert({
      visit_id: visitId,
      org_id: orgId,
      ...payload,
      updated_at: DateTime.now().toSQL(),
    })
  }

  async run() {
    const organizations = await db.from('organizations').select('id', 'company_name').orderBy('id', 'asc')

    for (const organization of organizations) {
      const employees = (await db
        .from('employees')
        .where('org_id', organization.id)
        .where('status', 'active')
        .select('id', 'org_id', 'first_name', 'last_name', 'role_id', 'manager_id')
        .orderBy('id', 'asc')) as EmployeeRow[]

      if (!employees.length) {
        continue
      }

      const admin = employees.find((employee) => [1, 2, 3].includes(Number(employee.role_id ?? 0))) ?? employees[0]
      const manager = employees.find((employee) => Number(employee.role_id ?? 0) === 4) ?? admin
      const member = employees.find((employee) => Number(employee.role_id ?? 0) === 5) ?? employees[employees.length - 1]

      const clientA = await this.ensureClient(organization.id, {
        name: `${organization.company_name} Strategic Account`,
        industry: 'Technology Services',
        contact_person: 'Riya Sharma',
        email: 'riya.sharma@example.com',
        phone: '+91-9898989898',
        address: 'Tower A, Business Bay',
        is_active: true,
      })

      const clientB = await this.ensureClient(organization.id, {
        name: `${organization.company_name} Field Operations`,
        industry: 'Manufacturing',
        contact_person: 'Arjun Mehta',
        email: 'arjun.mehta@example.com',
        phone: '+91-9777777777',
        address: 'Plot 42, Industrial Zone',
        is_active: true,
      })

      const visitorA = await this.ensureVisitor(organization.id, {
        client_id: clientA,
        full_name: 'Karan Malhotra',
        email: 'karan.malhotra@example.com',
        phone: '+91-9001001001',
        designation: 'Procurement Lead',
        address: 'Gurugram, Haryana',
        notes: 'Requires parking support on arrival.',
        is_active: true,
      })

      const visitorB = await this.ensureVisitor(organization.id, {
        client_id: clientB,
        full_name: 'Sneha Kapoor',
        email: 'sneha.kapoor@example.com',
        phone: '+91-9001001002',
        designation: 'Plant Operations Manager',
        address: 'Noida, Uttar Pradesh',
        notes: 'Prefers afternoon meetings.',
        is_active: true,
      })

      const now = DateTime.now()
      const plannedVisitId = await this.ensureVisit(organization.id, 'Quarterly client planning session', {
        client_id: clientA,
        visitor_id: visitorA,
        host_employee_id: member.id,
        created_by: admin.id,
        approver_employee_id: manager.id,
        approved_by: manager.id,
        purpose: `Review delivery roadmap, staffing alignment, and SLA expectations with ${this.employeeName(member)}.`,
        location_name: 'HQ Meeting Lounge',
        visit_type: 'client_meeting',
        priority: 'high',
        status: 'planned',
        requires_approval: true,
        scheduled_start: now.plus({ days: 1, hours: 2 }).toISO(),
        scheduled_end: now.plus({ days: 1, hours: 4 }).toISO(),
        reminder_at: now.plus({ days: 1, hours: 1 }).toISO(),
        approved_at: now.minus({ hours: 2 }).toISO(),
        approval_notes: 'Approved for strategic planning discussion.',
        attachment_urls: JSON.stringify(['https://example.com/visit-kit/planning-agenda.pdf']),
      })

      const inProgressVisitId = await this.ensureVisit(organization.id, 'Factory floor walkthrough', {
        client_id: clientB,
        visitor_id: visitorB,
        host_employee_id: manager.id,
        created_by: admin.id,
        approver_employee_id: admin.id,
        approved_by: admin.id,
        purpose: 'Capture current process bottlenecks and validate safety checkpoints with the client operations team.',
        location_name: 'Plant Unit 2',
        visit_type: 'site_visit',
        priority: 'critical',
        status: 'in_progress',
        requires_approval: false,
        scheduled_start: now.minus({ hours: 1 }).toISO(),
        scheduled_end: now.plus({ hours: 2 }).toISO(),
        reminder_at: now.minus({ hours: 2 }).toISO(),
        actual_check_in_at: now.minus({ minutes: 35 }).toISO(),
        check_in_latitude: 28.4595,
        check_in_longitude: 77.0266,
        check_in_address: 'Plant Unit 2 Gate 1',
        attachment_urls: JSON.stringify(['https://example.com/visit-kit/safety-checklist.pdf']),
      })

      const completedVisitId = await this.ensureVisit(organization.id, 'Follow-up closure meeting', {
        client_id: clientA,
        visitor_id: visitorA,
        host_employee_id: member.id,
        created_by: manager.id,
        approver_employee_id: admin.id,
        approved_by: admin.id,
        purpose: 'Close open action items from the previous quarter and secure client sign-off.',
        location_name: 'Conference Room B',
        visit_type: 'follow_up',
        priority: 'medium',
        status: 'completed',
        requires_approval: false,
        scheduled_start: now.minus({ days: 2, hours: 3 }).toISO(),
        scheduled_end: now.minus({ days: 2, hours: 1 }).toISO(),
        actual_check_in_at: now.minus({ days: 2, hours: 3 }).toISO(),
        actual_check_out_at: now.minus({ days: 2, hours: 1, minutes: 10 }).toISO(),
        check_in_latitude: 28.5355,
        check_in_longitude: 77.3910,
        check_out_latitude: 28.5357,
        check_out_longitude: 77.3913,
        check_in_address: 'Conference Room B',
        check_out_address: 'Conference Room B',
        completion_notes: 'Client accepted the updated execution plan.',
        attachment_urls: JSON.stringify(['https://example.com/visit-kit/closure-minutes.pdf']),
      })

      await this.ensureNote(plannedVisitId, organization.id, admin.id, 'planning', 'Agenda shared with the client and internal host team.')
      await this.ensureNote(inProgressVisitId, organization.id, manager.id, 'check_in', 'Visitor checked in at the plant gate and safety briefing completed.')
      await this.ensureNote(completedVisitId, organization.id, member.id, 'follow_up', 'All closure points reviewed and signed off by the visitor.')

      await this.ensureFollowUp(plannedVisitId, organization.id, {
        assigned_to: member.id,
        created_by: admin.id,
        status: 'open',
        priority: 'high',
        title: 'Prepare planning deck',
        description: `Finalize presentation before meeting with ${this.employeeName(member)} and the client delegation.`,
        due_at: now.plus({ hours: 18 }).toISO(),
      })

      await this.ensureFollowUp(inProgressVisitId, organization.id, {
        assigned_to: manager.id,
        created_by: admin.id,
        status: 'in_progress',
        priority: 'critical',
        title: 'Record observed floor issues',
        description: 'Log observations and corrective actions from the ongoing site visit.',
        due_at: now.plus({ hours: 5 }).toISO(),
      })

      await this.ensureFollowUp(completedVisitId, organization.id, {
        assigned_to: admin.id,
        created_by: manager.id,
        status: 'completed',
        priority: 'medium',
        title: 'Send signed MOM to client',
        description: 'Share approved closure minutes and archived proof documents.',
        due_at: now.minus({ days: 1 }).toISO(),
        completed_at: now.minus({ hours: 12 }).toISO(),
      })
    }
  }
}
