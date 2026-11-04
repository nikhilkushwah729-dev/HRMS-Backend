import { HttpContext } from '@adonisjs/core/http'
import PayrollService from '#services/PayrollService'
import AuditLogService from '#services/AuditLogService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class PayrollsController {
    constructor(
        protected payrollService: PayrollService,
        protected auditLogService: AuditLogService
    ) { }

    static payrollValidator = vine.compile(
        vine.object({
            employeeId: vine.number(),
            month: vine.number().min(1).max(12),
            year: vine.number(),
        })
    )

    /**
     * List all payrolls
     */
    async index({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { month, year } = request.qs()
        const payrolls = await this.payrollService.list(employee.orgId, month, year)
        return response.ok({
            status: 'success',
            data: payrolls,
        })
    }

    /**
     * Generate payroll
     */
    async process({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!
        const { employeeId, month, year } = await request.validateUsing(PayrollsController.payrollValidator)
        const payroll = await this.payrollService.generate(employeeId, currentUser.orgId, month, year)

        await this.auditLogService.logCreate({
            orgId: currentUser.orgId,
            userId: currentUser.id,
            module: 'PAYROLL',
            entityType: 'Payroll',
            entityId: payroll.id,
            newValues: payroll.toJSON ? payroll.toJSON() : payroll,
            description: `Processed payroll for employee #${employeeId} for period ${month}/${year}`,
            ctx: { auth, request, response } as HttpContext,
        })

        return response.created({
            status: 'success',
            message: 'Payroll generated successfully',
            data: payroll,
        })
    }
}
