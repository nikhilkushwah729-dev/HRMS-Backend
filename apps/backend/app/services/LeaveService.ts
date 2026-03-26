import Leave from '#models/leave'
import Employee from '#models/employee'
import LeaveType from '#models/leave_type'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class LeaveService {
    private balanceColors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2']

    private defaultLeaveTypes = [
        {
            typeName: 'Casual Leave',
            daysAllowed: 12,
            carryForward: false,
            maxCarryDays: 0,
            isPaid: true,
            requiresDoc: false,
        },
        {
            typeName: 'Sick Leave',
            daysAllowed: 8,
            carryForward: false,
            maxCarryDays: 0,
            isPaid: true,
            requiresDoc: true,
        },
        {
            typeName: 'Earned Leave',
            daysAllowed: 15,
            carryForward: true,
            maxCarryDays: 30,
            isPaid: true,
            requiresDoc: false,
        },
    ]

    /**
     * List leaves for employee or organization
     */
    async list(orgId: number, employeeId?: number) {
        const query = Leave.query().where('org_id', orgId)
        if (employeeId) {
            query.where('employee_id', employeeId)
        }
        return await query.preload('leaveType').preload('employee', (q) => q.preload('manager')).orderBy('created_at', 'desc')
    }

    /**
     * Submit leave request
     */
    async create(employeeId: number, orgId: number, data: any) {
        return await Leave.create({ ...data, employeeId, orgId, status: 'pending' })
    }

    /**
     * Approve/Reject leave
     */
    async updateStatus(id: number, orgId: number, status: 'approved' | 'rejected', approverId: number, rejectionNote?: string) {
        const leave = await Leave.query().where('id', id).where('org_id', orgId).preload('employee').first()
        if (!leave) {
            throw new Exception('Leave request not found', { status: 404 })
        }

        // Pass user ID for audit logging
        leave.$extras.userId = approverId

        // 1. Cannot approve own leave
        if (leave.employeeId === approverId) {
            throw new Exception('You cannot approve your own leave request', { status: 403 })
        }

        const approver = await Employee.query().where('id', approverId).preload('role').first()
        if (!approver) {
            throw new Exception('Approver not found', { status: 404 })
        }

        // 2. Authorization Check:
        // - Is Manager of the employee?
        // - or Is Admin / HR?
        const isAdmin = approver.role?.roleName === 'Admin' || approver.role?.roleName === 'HR'
        const isManager = leave.employee.managerId === approverId

        if (!isAdmin && !isManager) {
            throw new Exception('You are not authorized to approve this leave request. Only the assigned manager or an Administrator can act on it.', { status: 403 })
        }

        leave.status = status
        leave.approvedBy = approverId
        leave.approvedAt = DateTime.now()
        if (rejectionNote) {
            leave.rejectionNote = rejectionNote
        }

        await leave.save()
        return leave
    }

    /**
     * Get Leave Types
     */
    async getLeaveTypes(orgId: number, employeeId?: number, year?: number) {
        const targetYear = year ?? DateTime.now().year
        let types = await LeaveType.query().where('org_id', orgId).orderBy('id', 'asc')

        // Auto-bootstrap defaults for existing organizations that don't have leave types.
        if (types.length === 0) {
            await db.table('leave_types').multiInsert(
                this.defaultLeaveTypes.map((type) => ({
                    org_id: orgId,
                    type_name: type.typeName,
                    days_allowed: type.daysAllowed,
                    carry_forward: type.carryForward,
                    max_carry_days: type.maxCarryDays,
                    is_paid: type.isPaid,
                    requires_doc: type.requiresDoc,
                }))
            )

            types = await LeaveType.query().where('org_id', orgId).orderBy('id', 'asc')
        }

        if (!employeeId) {
            return types
        }

        const usageRows = await db
            .from('leaves')
            .where('org_id', orgId)
            .where('employee_id', employeeId)
            .where('status', 'approved')
            .whereRaw('YEAR(start_date) = ?', [targetYear])
            .groupBy('leave_type_id')
            .select('leave_type_id')
            .sum('total_days as used_days')

        const usageByType = new Map<number, number>()
        for (const row of usageRows as Array<{ leave_type_id: number | null; used_days: string | number }>) {
            if (!row.leave_type_id) continue
            usageByType.set(row.leave_type_id, Number(row.used_days || 0))
        }

        return types.map((type, index) => {
            const total = Number(type.daysAllowed || 0)
            const used = usageByType.get(type.id) || 0
            const remaining = Math.max(total - used, 0)

            return {
                ...type.serialize(),
                type: type.typeName,
                color: this.balanceColors[index % this.balanceColors.length],
                year: targetYear,
                total,
                used,
                remaining,
            }
        })
    }
}
