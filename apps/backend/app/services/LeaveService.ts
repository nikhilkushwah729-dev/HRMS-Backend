import Leave from '#models/leave'
import Employee from '#models/employee'
import Holiday from '#models/holiday'
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
     * Update leave request
     */
    async update(id: number, orgId: number, data: any) {
        const leave = await Leave.query().where('id', id).where('org_id', orgId).first()
        if (!leave) {
            throw new Exception('Leave request not found', { status: 404 })
        }
        if (leave.status !== 'pending') {
            throw new Exception('Only pending leave requests can be updated', { status: 400 })
        }
        leave.merge(data)
        await leave.save()
        return leave
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

    /**
     * Dashboard payload for the leave workspace.
     */
    async dashboard(orgId: number, employeeId: number, canApprove: boolean, year?: number, fromDate?: string, toDate?: string) {
        const targetYear = year ?? DateTime.now().year
        const rangeEnd = toDate ? DateTime.fromISO(toDate) : DateTime.now()
        const rangeStart = fromDate ? DateTime.fromISO(fromDate) : rangeEnd.minus({ days: 45 })
        const safeRangeStart = rangeStart.isValid ? rangeStart : DateTime.now().minus({ days: 45 })
        const safeRangeEnd = rangeEnd.isValid ? rangeEnd : DateTime.now()
        const [balances, leaves, upcomingHolidays] = await Promise.all([
            this.getLeaveTypes(orgId, employeeId, targetYear),
            this.list(orgId, canApprove ? undefined : employeeId),
            Holiday.query()
                .where('org_id', orgId)
                .where('holiday_date', '>=', DateTime.now().toISODate()!)
                .orderBy('holiday_date', 'asc')
                .limit(6),
        ])
        const totalEmployees = await Employee.query().where('org_id', orgId).where('status', 'active').count('* as total')
        const totalEmployeesCount = Number(totalEmployees[0].$extras.total || 0)

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthlyUsage = months.map((month, index) => ({
            month,
            monthIndex: index + 1,
            paid: 0,
            unpaid: 0,
            pending: 0,
            approved: 0,
        }))

        for (const leave of leaves) {
            if (!leave.startDate || leave.startDate.year !== targetYear) continue

            const bucket = monthlyUsage[leave.startDate.month - 1]
            if (!bucket) continue

            const totalDays = Number(leave.totalDays || 0)
            if (leave.status === 'pending') {
                bucket.pending += totalDays
                continue
            }

            if (leave.status !== 'approved') continue

            bucket.approved += totalDays
            if (leave.leaveType?.isPaid === false) {
                bucket.unpaid += totalDays
            } else {
                bucket.paid += totalDays
            }
        }

        const rangeLeaves = leaves.filter((leave) => {
            if (!leave.startDate) return false
            const startMs = leave.startDate.toMillis()
            return startMs >= safeRangeStart.startOf('day').toMillis() && startMs <= safeRangeEnd.endOf('day').toMillis()
        })

        const leaveTypeUsage = new Map<string, { leaveName: string; leaveShortName: string; totalLeaveCount: number; color: string }>()
        for (const leave of rangeLeaves) {
            if (leave.status !== 'approved') continue
            const typeName = leave.leaveType?.typeName || 'Unknown'
            const existing = leaveTypeUsage.get(typeName) || {
                leaveName: typeName,
                leaveShortName: typeName.split(/\s+/).map((part) => part[0]).join('').slice(0, 3).toUpperCase(),
                totalLeaveCount: 0,
                color: '#0ea5e9',
            }
            existing.totalLeaveCount += Number(leave.totalDays || 0)
            leaveTypeUsage.set(typeName, existing)
        }

        const paidUnpaidSummary = rangeLeaves.reduce(
            (acc, leave) => {
                if (leave.status !== 'approved') return acc
                const totalDays = Number(leave.totalDays || 0)
                if (leave.leaveType?.isPaid === false) acc.unPaidCount += totalDays
                else acc.paidCount += totalDays
                return acc
            },
            { paidCount: 0, unPaidCount: 0 }
        )

        const departmentRows = await db
            .from('leaves')
            .leftJoin('employees', 'employees.id', 'leaves.employee_id')
            .leftJoin('departments', 'departments.id', 'employees.department_id')
            .where('leaves.org_id', orgId)
            .where('leaves.status', 'approved')
            .whereRaw('YEAR(leaves.start_date) = ?', [targetYear])
            .groupBy('departments.department_name')
            .select('departments.department_name as department_name')
            .sum('leaves.total_days as leave_count')

        const departmentAnnual = (departmentRows as Array<{ department_name: string | null; leave_count: string | number }>).map((row) => ({
            department: row.department_name || 'Unassigned',
            leaveCount: Number(row.leave_count || 0),
        }))

        const onLeaveToday = leaves.filter((leave) => {
            if (leave.status !== 'approved') return false
            const today = DateTime.now().startOf('day')
            return leave.startDate.toMillis() <= today.toMillis() && leave.endDate.toMillis() >= today.toMillis()
        }).length

        const summary = leaves.reduce(
            (acc, leave) => {
                acc.totalRequests += 1
                if (leave.employeeId === employeeId) acc.ownRequests += 1
                if (leave.status === 'pending') {
                    acc.pending += 1
                    if (leave.employeeId !== employeeId) acc.approvalQueue += 1
                }
                if (leave.status === 'approved') acc.approved += 1
                if (leave.status === 'rejected') acc.rejected += 1
                if (leave.status === 'cancelled') acc.cancelled += 1
                return acc
            },
            {
                totalRequests: 0,
                ownRequests: 0,
                approvalQueue: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                cancelled: 0,
            }
        )

        return {
            year: targetYear,
            canApprove,
            range: {
                from: safeRangeStart.toISODate(),
                to: safeRangeEnd.toISODate(),
            },
            balances,
            leaveTypes: balances,
            requests: leaves,
            summary: {
                ...summary,
                totalEmployees: totalEmployeesCount,
                onLeave: onLeaveToday,
                entitlement: balances.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0),
                used: balances.reduce((sum: number, item: any) => sum + Number(item.used || 0), 0),
                remaining: balances.reduce((sum: number, item: any) => sum + Number(item.remaining || 0), 0),
            },
            leaveTypeUsage: Array.from(leaveTypeUsage.values()),
            paidUnpaidSummary,
            monthlyUsage,
            departmentAnnual,
            upcomingHolidays: upcomingHolidays.map((holiday) => ({
                id: holiday.id,
                name: holiday.name,
                date: holiday.holidayDate.toISODate(),
                type: holiday.type,
            })),
        }
    }

    async createLeaveType(orgId: number, data: {
        typeName: string
        daysAllowed: number
        carryForward?: boolean
        maxCarryDays?: number
        isPaid?: boolean
        requiresDoc?: boolean
    }) {
        return await LeaveType.create({
            orgId,
            typeName: data.typeName,
            daysAllowed: data.daysAllowed,
            carryForward: data.carryForward ?? false,
            maxCarryDays: data.maxCarryDays ?? 0,
            isPaid: data.isPaid ?? true,
            requiresDoc: data.requiresDoc ?? false,
        })
    }

    async updateLeaveType(orgId: number, leaveTypeId: number, data: {
        typeName: string
        daysAllowed: number
        carryForward?: boolean
        maxCarryDays?: number
        isPaid?: boolean
        requiresDoc?: boolean
    }) {
        const leaveType = await LeaveType.query()
            .where('org_id', orgId)
            .where('id', leaveTypeId)
            .first()

        if (!leaveType) {
            throw new Exception('Leave type not found', { status: 404 })
        }

        leaveType.merge({
            typeName: data.typeName,
            daysAllowed: data.daysAllowed,
            carryForward: data.carryForward ?? false,
            maxCarryDays: data.maxCarryDays ?? 0,
            isPaid: data.isPaid ?? true,
            requiresDoc: data.requiresDoc ?? false,
        })
        await leaveType.save()
        return leaveType
    }

    async deleteLeaveType(orgId: number, leaveTypeId: number) {
        const leaveType = await LeaveType.query()
            .where('org_id', orgId)
            .where('id', leaveTypeId)
            .first()

        if (!leaveType) {
            throw new Exception('Leave type not found', { status: 404 })
        }

        await leaveType.delete()
        return true
    }
}
