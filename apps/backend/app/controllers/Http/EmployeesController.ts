import { HttpContext } from '@adonisjs/core/http'
import EmployeeService from '#services/EmployeeService'
import AuditLogService from '#services/AuditLogService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import Geofence from '#models/geofence'
import Employee from '#models/employee'

@inject()
export default class EmployeesController {
    constructor(
        protected employeeService: EmployeeService,
        protected auditLogService: AuditLogService
    ) { }

    static employeeValidator = vine.compile(
        vine.object({
            firstName: vine.string().trim().maxLength(100),
            lastName: vine.string().trim().maxLength(100).optional(),
            email: vine.string().email().optional(),
            phone: vine.string().optional(),
            departmentId: vine.number().optional(),
            designationId: vine.number().optional(),
            roleId: vine.number().optional(),
            employeeCode: vine.string().optional(),
            status: vine.enum(['active', 'inactive', 'on_leave', 'terminated'] as const).optional(),
            salary: vine.number().optional(),
            password: vine.string().minLength(8).optional(),
            // Missing fields from schema
            gender: vine.enum(['male', 'female', 'other', 'prefer_not_to_say'] as const).optional(),
            dateOfBirth: vine.string().optional(), // Validated as string, parsed as DateTime
            address: vine.string().optional(),
            emergencyContact: vine.string().optional(),
            emergencyPhone: vine.string().optional(),
            bankAccount: vine.string().optional(),
            bankName: vine.string().optional(),
            ifscCode: vine.string().optional(),
            panNumber: vine.string().optional(),
            aadharLast4: vine.string().fixedLength(4).optional(),
            joinDate: vine.string().optional(),
            countryCode: vine.string().maxLength(5).optional(),
            countryName: vine.string().maxLength(100).optional(),
        })
    )

    /**
     * List all employees
     */
    async index({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const filters = request.qs()
        const employees = await this.employeeService.list(employee.orgId, filters)
        return response.ok({
            status: 'success',
            data: employees,
        })
    }

    /**
     * Show employee details
     */
    async show({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!
        const id = params.id
        const employee = await this.employeeService.getById(id, currentUser.orgId)
        return response.ok({
            status: 'success',
            data: employee,
        })
    }

    /**
     * Create new employee
     */
    async store({ auth, request, response }: HttpContext) {
        try {
            const currentUser = auth.user!
            const data = await request.validateUsing(EmployeesController.employeeValidator)

            // Extract password and prepare payload
            const { password, ...employeeData } = data

            const payload: any = {
                ...employeeData,
                status: employeeData.status || 'active',
                passwordHash: password // Service or model will handle hashing
            }

            const employee = await this.employeeService.create(currentUser.orgId, payload)

            await this.auditLogService.log({
                orgId: currentUser.orgId,
                employeeId: currentUser.id,
                action: 'CREATE',
                module: 'employees',
                entityName: 'employees',
                entityId: employee.id,
                newValues: employee.toJSON(),
                ctx: { request } as any // Simplified for ctx.request.ip() compatibility
            })

            return response.created({
                status: 'success',
                message: 'Employee created successfully',
                data: employee,
            })
        } catch (error) {
            if (error.messages) {
                return response.badRequest({
                    status: 'error',
                    message: 'Validation failed',
                    errors: error.messages
                })
            }
            return response.internalServerError({
                status: 'error',
                message: error.message || 'Internal server error'
            })
        }
    }

    /**
     * Update employee
     */
    async update({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!
        const id = params.id
        const data = await request.validateUsing(EmployeesController.employeeValidator)

        // prepare payload (handle password if provided)
        const { password, ...employeeData } = data
        const payload: any = { ...employeeData }
        if (password) {
            payload.passwordHash = password
        }

        const employee = await this.employeeService.update(id, currentUser.orgId, payload)

        await this.auditLogService.log({
            orgId: currentUser.orgId,
            employeeId: currentUser.id,
            action: 'UPDATE',
            module: 'employees',
            entityName: 'employees',
            entityId: employee.id,
            newValues: payload,
            ctx: { request } as any
        })

        return response.ok({
            status: 'success',
            message: 'Employee updated successfully',
            data: employee,
        })
    }

    /**
     * Delete employee
     */
    async destroy({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!
        const id = params.id
        await this.employeeService.delete(id, currentUser.orgId, currentUser.id)

        await this.auditLogService.log({
            orgId: currentUser.orgId,
            employeeId: currentUser.id,
            action: 'DELETE',
            module: 'employees',
            entityName: 'employees',
            entityId: id,
            ctx: { request } as any
        })

        return response.ok({
            status: 'success',
            message: 'Employee deleted successfully',
        })
    }

    /**
     * Update employee geofence
     */
    async updateGeofence({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!
        const employeeId = params.id
        
        // Accept geofence_zone_id from frontend and map to geofenceId
        const { geofence_zone_id } = await request.validateUsing(
            vine.compile(
                vine.object({
                    geofence_zone_id: vine.number().nullable(),
                    requires_geofence: vine.boolean().optional(),
                })
            )
        )

        const requiresGeofence = request.input('requires_geofence', true)

        // Find the employee
        const employee = await Employee.query()
            .where('id', employeeId)
            .where('org_id', currentUser.orgId)
            .first()

        if (!employee) {
            return response.notFound({
                status: 'error',
                message: 'Employee not found'
            })
        }

        // If geofence_zone_id is provided, verify it exists
        if (geofence_zone_id) {
            const geofence = await Geofence.query()
                .where('id', geofence_zone_id)
                .where('org_id', currentUser.orgId)
                .first()

            if (!geofence) {
                return response.notFound({
                    status: 'error',
                    message: 'Geofence not found'
                })
            }
        }

        // Update the employee's geofence
        const targetEmployee = employee as Employee
        targetEmployee.geofenceId = requiresGeofence ? (geofence_zone_id ?? null) : null
        await targetEmployee.save()

        await this.auditLogService.log({
            orgId: currentUser.orgId,
            employeeId: currentUser.id,
            action: 'UPDATE',
            module: 'employees',
            entityName: 'employees',
            entityId: targetEmployee.id,
            newValues: { geofenceId: targetEmployee.geofenceId, requires_geofence: !!targetEmployee.geofenceId },
            ctx: { request } as any
        })

        return response.ok({
            status: 'success',
            message: 'Employee geofence updated successfully',
            data: targetEmployee
        })
    }

    /**
     * Get employee geofence
     */
    async getGeofence({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!
        const employeeId = params.id

        const employee = await Employee.query()
            .where('id', employeeId)
            .where('org_id', currentUser.orgId)
            .preload('geofence')
            .first()

        if (!employee) {
            return response.notFound({
                status: 'error',
                message: 'Employee not found'
            })
        }

        // Return in the format expected by frontend
        return response.ok({
            status: 'success',
            data: {
                geofence_zone_id: employee.geofenceId,
                requires_geofence: !!employee.geofenceId
            }
        })
    }

    /**
     * Remove employee geofence
     */
    async removeGeofence({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!
        const employeeId = params.id

        const employee = await Employee.query()
            .where('id', employeeId)
            .where('org_id', currentUser.orgId)
            .first()

        if (!employee) {
            return response.notFound({
                status: 'error',
                message: 'Employee not found'
            })
        }

        employee.geofenceId = null
        await employee.save()

        await this.auditLogService.log({
            orgId: currentUser.orgId,
            employeeId: currentUser.id,
            action: 'UPDATE',
            module: 'employees',
            entityName: 'employees',
            entityId: employee.id,
            newValues: { geofenceId: null },
            ctx: { request } as any
        })

        return response.ok({
            status: 'success',
            message: 'Employee geofence removed successfully'
        })
    }
}
