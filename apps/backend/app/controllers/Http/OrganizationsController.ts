import { HttpContext } from '@adonisjs/core/http'
import OrganizationService from '#services/OrganizationService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class OrganizationsController {
    constructor(protected orgService: OrganizationService) { }

    static orgValidator = vine.compile(
        vine.object({
            companyName: vine.string().maxLength(255).optional(),
            email: vine.string().email().optional(),
            phone: vine.string().optional(),
            address: vine.string().optional(),
        })
    )

    static departmentValidator = vine.compile(
        vine.object({
            name: vine.string().maxLength(100),
            description: vine.string().optional(),
        })
    )

    static designationValidator = vine.compile(
        vine.object({
            name: vine.string().maxLength(100),
            departmentId: vine.number().optional(),
        })
    )

    /**
     * Get current organization details
     */
    async show({ auth, response }: HttpContext) {
        const employee = auth.user!
        const org = await this.orgService.getById(employee.orgId)
        return response.ok({
            status: 'success',
            data: org,
        })
    }

    /**
     * Update organization details
     */
    async update({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(OrganizationsController.orgValidator)
        const org = await this.orgService.update(employee.orgId, data)
        return response.ok({
            status: 'success',
            message: 'Organization updated',
            data: org,
        })
    }

    /**
     * Department endpoints
     */
    async getDepartments({ auth, response }: HttpContext) {
        const employee = auth.user!
        const departments = await this.orgService.getDepartments(employee.orgId)
        return response.ok({
            status: 'success',
            data: departments,
        })
    }

    async storeDepartment({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(OrganizationsController.departmentValidator)
        const department = await this.orgService.addDepartment(employee.orgId, data)
        return response.created({
            status: 'success',
            message: 'Department created',
            data: department,
        })
    }

    async getDesignations({ auth, response }: HttpContext) {
        const employee = auth.user!
        const designations = await this.orgService.getDesignations(employee.orgId)
        return response.ok({
            status: 'success',
            data: designations,
        })
    }

    async storeDesignation({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(OrganizationsController.designationValidator)
        const designation = await this.orgService.addDesignation(employee.orgId, data.departmentId ?? null, {
            name: data.name,
        })
        return response.created({
            status: 'success',
            message: 'Designation created',
            data: designation,
        })
    }

    /**
     * Addon / Module settings
     */
    async getAddons({ auth, response }: HttpContext) {
        const employee = auth.user!
        const addons = await this.orgService.getAddons(employee.orgId)
        return response.ok({
            status: 'success',
            data: addons,
        })
    }

    async toggleAddon({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { addonId, isActive } = request.only(['addonId', 'isActive'])
        await this.orgService.toggleAddon(employee.orgId, addonId, isActive)
        return response.ok({
            status: 'success',
            message: 'Module status updated',
        })
    }
}
