import Expense from '#models/expense'
import Employee from '#models/employee'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

export default class ExpenseService {
    async list(orgId: number, employeeId?: number) {
        const query = Expense.query().where('org_id', orgId)
        if (employeeId) query.where('employee_id', employeeId)
        return await query.preload('employee', (q) => q.preload('manager')).orderBy('expense_date', 'desc')
    }

    async create(employeeId: number, orgId: number, data: any) {
        return await Expense.create({ ...data, employeeId, orgId, status: 'pending' })
    }

    async updateStatus(id: number, orgId: number, status: 'approved' | 'rejected', approverId: number, rejectionNote?: string) {
        const expense = await Expense.query().where('id', id).where('org_id', orgId).preload('employee').first()
        if (!expense) throw new Exception('Expense not found', { status: 404 })

        // Pass user ID for audit logging
        expense.$extras.userId = approverId

        // 1. Cannot approve own expense
        if (expense.employeeId === approverId) {
            throw new Exception('You cannot approve your own expense claim', { status: 403 })
        }

        const approver = await Employee.query().where('id', approverId).preload('role').first()
        if (!approver) throw new Exception('Approver not found', { status: 404 })

        // 2. Authorization Check: Admin/HR or Direct Manager
        const isAdmin = approver.role?.roleName === 'Admin' || approver.role?.roleName === 'HR'
        const isManager = expense.employee.managerId === approverId

        if (!isAdmin && !isManager) {
            throw new Exception('You are not authorized to approve this expense. Only the assigned manager or an Administrator can act on it.', { status: 403 })
        }

        expense.status = status
        expense.approvedBy = approverId
        expense.approvedAt = DateTime.now()
        if (rejectionNote) {
            expense.rejectionNote = rejectionNote
        }

        await expense.save()
        return expense
    }
}
