import { HttpContext } from '@adonisjs/core/http'
import LeaveService from '#services/LeaveService'
import AuditLogService from '#services/AuditLogService'
import AuthorizationService from '#services/AuthorizationService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import LeaveBalance from '#models/leave_balance'

@inject()
export default class LeavesController {
    constructor(
        protected leaveService: LeaveService,
        protected auditLogService: AuditLogService,
        protected authorizationService: AuthorizationService
    ) { }

    static leaveValidator = vine.compile(
        vine.object({
            leaveTypeId: vine.number(),
            startDate: vine.date(),
            endDate: vine.date(),
            reason: vine.string().trim().optional(),
        })
    )

    static statusValidator = vine.compile(
        vine.object({
            status: vine.enum(['approved', 'rejected'] as const),
            rejectionNote: vine.string().trim().optional()
        })
    )

    static balanceValidator = vine.compile(
        vine.object({
            leaveTypeId: vine.number(),
            employeeId: vine.number().optional(),
            year: vine.number().optional(),
            adjustment: vine.number(), // positive or negative
            reason: vine.string().trim(),
        })
    )

    static leaveTypeValidator = vine.compile(
        vine.object({
            typeName: vine.string().trim().minLength(2).maxLength(100),
            daysAllowed: vine.number(),
            carryForward: vine.boolean().optional(),
            maxCarryDays: vine.number().optional(),
            isPaid: vine.boolean().optional(),
            requiresDoc: vine.boolean().optional(),
        })
    )

    /**
     * List leaves
     */
    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        try {
            const leaves = await this.leaveService.list(employee.orgId, employee.id)
            return response.ok({
                status: 'success',
                data: leaves,
            })
        } catch (error) {
            console.error('Failed to list leaves:', error)
            return response.ok({
                status: 'success',
                data: [],
            })
        }
    }

    /**
     * Submit leave request
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(LeavesController.leaveValidator)
        const leave = await this.leaveService.create(employee.id, employee.orgId, data)
        
        // Audit log for leave creation
        await this.auditLogService.log({
            orgId: employee.orgId,
            employeeId: employee.id,
            action: 'CREATE',
            module: 'leaves',
            entityName: 'leaves',
            entityId: leave.id,
            newValues: {
                leaveTypeId: data.leaveTypeId,
                startDate: data.startDate,
                endDate: data.endDate,
                reason: data.reason
            },
            ctx: { request } as any
        })
        
        return response.created({
            status: 'success',
            message: 'Leave request submitted',
            data: leave,
        })
    }

    /**
     * Update leave request
     */
    async update({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(LeavesController.leaveValidator)
        const leave = await this.leaveService.update(Number(params.id), employee.orgId, data)
        
        await this.auditLogService.log({
            orgId: employee.orgId,
            employeeId: employee.id,
            action: 'UPDATE',
            module: 'leaves',
            entityName: 'leaves',
            entityId: leave.id,
            newValues: data,
            ctx: { request } as any
        })
        
        return response.ok({
            status: 'success',
            message: 'Leave request updated',
            data: leave,
        })
    }

    /**
     * Get available leave types
     */
    async getTypes({ auth, request, response }: HttpContext) {
        const yearParam = Number(request.input('year'))
        const year = Number.isInteger(yearParam) && yearParam > 0 ? yearParam : undefined
        const types = await this.leaveService.getLeaveTypes(employee.orgId, employee.id, year)
        return response.ok({
            status: 'success',
            data: types,
        })
    }

    async createType({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(LeavesController.leaveTypeValidator)
        const type = await this.leaveService.createLeaveType(employee.orgId, data)
        return response.created({
            status: 'success',
            message: 'Leave type created',
            data: type,
        })
    }

    async updateType({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(LeavesController.leaveTypeValidator)
        const type = await this.leaveService.updateLeaveType(employee.orgId, Number(params.id), data)
        return response.ok({
            status: 'success',
            message: 'Leave type updated',
            data: type,
        })
    }

    async destroyType({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        await this.leaveService.deleteLeaveType(employee.orgId, Number(params.id))
        return response.ok({
            status: 'success',
            message: 'Leave type deleted',
        })
    }

    /**
     * Approve/Reject leave
     */
    async updateStatus({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const id = params.id
        const { status, rejectionNote } = await request.validateUsing(LeavesController.statusValidator)
        
        // Get old leave data for audit
        const oldLeaves = await this.leaveService.list(employee.orgId)
        const oldLeave = oldLeaves.find((l: any) => l.id === id)
        
        const leave = await this.leaveService.updateStatus(id, employee.orgId, status, employee.id, rejectionNote)
        
        // Audit log for status change
        await this.auditLogService.log({
            orgId: employee.orgId,
            employeeId: employee.id,
            action: status === 'approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
            module: 'leaves',
            entityName: 'leaves',
            entityId: id,
            oldValues: oldLeave ? {
                status: oldLeave.status,
                leaveTypeId: oldLeave.leaveTypeId,
                startDate: oldLeave.startDate,
                endDate: oldLeave.endDate
            } : null,
            newValues: {
                status: status,
                rejectionNote: rejectionNote
            },
            ctx: { request } as any
        })
        
        return response.ok({
            status: 'success',
            message: `Leave ${status} successfully`,
            data: leave,
        })
    }

    /**
     * Get leave balances for employee
     */
    async getBalances({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const yearParam = Number(request.input('year'))
        const employeeIdParam = Number(request.input('employeeId'))

        const year = Number.isInteger(yearParam) && yearParam > 0 ? yearParam : new Date().getFullYear()
        try {
            const canViewOthers = await this.authorizationService.hasPermission(employee, 'leave_approve')
            const targetEmployeeId = canViewOthers && employeeIdParam ? employeeIdParam : employee.id
            const balances = await this.leaveService.getLeaveTypes(employee.orgId, targetEmployeeId, year)

            return response.ok({
                status: 'success',
                data: balances,
            })
        } catch (error) {
            console.error('Failed to load leave balances:', error)
            return response.ok({
                status: 'success',
                data: [],
            })
        }
    }

    /**
     * Adjust leave balance (admin only)
     */
    async adjustBalance({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const canAdjust = await this.authorizationService.hasPermission(employee, 'leave_process')
        if (!canAdjust) {
            return response.forbidden({ status: 'error', message: 'You do not have permission to adjust leave balances.' })
        }
        const data = await request.validateUsing(LeavesController.balanceValidator)
        
        const year = data.year || new Date().getFullYear()
        const targetEmployeeId = data.employeeId || employee.id

        // Check if balance exists
        let balance = await LeaveBalance.query()
            .where('employee_id', targetEmployeeId)
            .where('leave_type_id', data.leaveTypeId)
            .where('year', year)
            .first()

        if (balance) {
            // Update existing balance
            balance.totalDays = balance.totalDays + data.adjustment
            balance.remainingDays = balance.remainingDays + data.adjustment
            await balance.save()
        } else {
            // Create new balance
            balance = await LeaveBalance.create({
                employeeId: targetEmployeeId,
                leaveTypeId: data.leaveTypeId,
                year,
                totalDays: data.adjustment > 0 ? data.adjustment : 0,
                usedDays: 0,
                remainingDays: data.adjustment > 0 ? data.adjustment : 0,
            })
        }

        // Audit log for balance adjustment
        await this.auditLogService.log({
            orgId: employee.orgId,
            employeeId: employee.id,
            action: 'LEAVE_BALANCE_ADJUSTED',
            module: 'leaves',
            entityName: 'leave_balances',
            entityId: balance.id,
            newValues: {
                employeeId: targetEmployeeId,
                leaveTypeId: data.leaveTypeId,
                year,
                adjustment: data.adjustment,
                reason: data.reason,
            },
            ctx: { request } as any
        })

        return response.ok({
            status: 'success',
            message: 'Leave balance adjusted successfully',
            data: balance,
        })
    }
}
