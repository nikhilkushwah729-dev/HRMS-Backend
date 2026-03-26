import { HttpContext } from '@adonisjs/core/http'
import ExpenseService from '#services/ExpenseService'
import AuditLogService from '#services/AuditLogService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class ExpensesController {
    constructor(
        protected expenseService: ExpenseService,
        protected auditLogService: AuditLogService
    ) { }

    static expenseValidator = vine.compile(
        vine.object({
            title: vine.string().maxLength(100),
            amount: vine.number().min(0),
            expenseDate: vine.string(),
            categoryId: vine.number().optional(),
            description: vine.string().optional(),
            receiptUrl: vine.string().optional(),
            projectId: vine.number().optional(),
        })
    )

    static statusValidator = vine.compile(
        vine.object({
            status: vine.enum(['approved', 'rejected'] as const),
            rejectionNote: vine.string().trim().optional()
        })
    )

    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const expenses = await this.expenseService.list(employee.orgId)
        return response.ok({ status: 'success', data: expenses })
    }

    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(ExpensesController.expenseValidator)
        const expense = await this.expenseService.create(employee.id, employee.orgId, data)
        
        // Audit log for expense creation
        await this.auditLogService.log({
            orgId: employee.orgId,
            employeeId: employee.id,
            action: 'CREATE',
            module: 'expenses',
            entityName: 'expenses',
            entityId: expense.id,
            newValues: data,
            ctx: { request } as any
        })
        
        return response.created({ status: 'success', data: expense })
    }

    async updateStatus({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const { status, rejectionNote } = await request.validateUsing(ExpensesController.statusValidator)
        
        // Get old expense data for audit
        const oldExpenses = await this.expenseService.list(employee.orgId)
        const oldExpense = oldExpenses.find((e: any) => e.id === params.id)
        
        const expense = await this.expenseService.updateStatus(params.id, employee.orgId, status, employee.id, rejectionNote)
        
        // Audit log for status change
        await this.auditLogService.log({
            orgId: employee.orgId,
            employeeId: employee.id,
            action: status === 'approved' ? 'EXPENSE_APPROVED' : 'EXPENSE_REJECTED',
            module: 'expenses',
            entityName: 'expenses',
            entityId: params.id,
            oldValues: oldExpense ? {
                status: oldExpense.status,
                amount: oldExpense.amount,
                title: oldExpense.title
            } : null,
            newValues: {
                status: status,
                rejectionNote: rejectionNote
            },
            ctx: { request } as any
        })
        
        return response.ok({ status: 'success', data: expense })
    }
}
