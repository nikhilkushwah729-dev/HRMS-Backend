import { HttpContext } from '@adonisjs/core/http'
import OrganizationService from '#services/OrganizationService'
import MediaUploadService from '#services/MediaUploadService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class OrganizationsController {
    constructor(
        protected orgService: OrganizationService,
        protected mediaUploadService: MediaUploadService
    ) { }

    static orgValidator = vine.compile(
        vine.object({
            companyName: vine.string().maxLength(255).optional(),
            email: vine.string().email().optional(),
            phone: vine.string().optional(),
            address: vine.string().optional(),
            city: vine.string().maxLength(100).optional(),
            state: vine.string().maxLength(100).optional(),
            country: vine.string().maxLength(100).optional(),
            postalCode: vine.string().maxLength(20).optional(),
            gstin: vine.string().maxLength(20).optional(),
            logo: vine.string().optional(),
            timezone: vine.string().maxLength(50).optional(),
            orgType: vine.string().optional(),
            defaultLanguage: vine.string().maxLength(10).optional(),
            allowedLoginMethods: vine.string().maxLength(100).optional(),
        })
    )

    static departmentValidator = vine.compile(
        vine.object({
            name: vine.string().maxLength(100),
            parentId: vine.number().nullable().optional(),
            description: vine.string().optional(),
            isActive: vine.boolean().optional(),
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
        const normalizedData = await this.normalizeLogoPayload(data)
        const org = await this.orgService.update(employee.orgId, normalizedData)
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

    async updateDepartment({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(OrganizationsController.departmentValidator)
        const department = await this.orgService.updateDepartment(employee.orgId, Number(params.id), data)
        return response.ok({
            status: 'success',
            message: 'Department updated',
            data: department,
        })
    }

    async destroyDepartment({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        await this.orgService.deleteDepartment(employee.orgId, Number(params.id))
        return response.ok({
            status: 'success',
            message: 'Department deleted',
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

    async updateDesignation({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(OrganizationsController.designationValidator)
        const designation = await this.orgService.updateDesignation(employee.orgId, Number(params.id), {
            name: data.name,
            departmentId: data.departmentId ?? null,
        })
        return response.ok({
            status: 'success',
            message: 'Designation updated',
            data: designation,
        })
    }

    async destroyDesignation({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        await this.orgService.deleteDesignation(employee.orgId, Number(params.id))
        return response.ok({
            status: 'success',
            message: 'Designation deleted',
        })
    }

    async getSettingCollection({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const settingKey = this.normalizeSettingKey(params.key)
        const items = await this.orgService.getSettingCollection(employee.orgId, settingKey)
        return response.ok({
            status: 'success',
            data: items,
        })
    }

    async saveSettingCollection({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const settingKey = this.normalizeSettingKey(params.key)
        const items = request.input('items', [])

        if (!Array.isArray(items)) {
            return response.badRequest({
                status: 'error',
                message: 'items must be an array',
            })
        }

        const savedItems = await this.orgService.saveSettingCollection(employee.orgId, settingKey, items)
        return response.ok({
            status: 'success',
            message: 'Organization settings saved',
            data: savedItems,
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

    private normalizeSettingKey(rawKey: unknown): string {
        const key = String(rawKey || '').trim().toLowerCase()
        const normalized = key.replace(/[^a-z0-9_-]/g, '')
        if (!normalized) {
            throw new Error('Invalid setting key')
        }
        return normalized.slice(0, 150)
    }

    private async normalizeLogoPayload<T extends Record<string, any> & { logo?: string | null }>(data: T): Promise<T> {
        if (data?.logo === null) {
            return data
        }

        if (!data?.logo || typeof data.logo !== 'string') {
            return data
        }

        const logoValue = data.logo.trim()
        const storedLogo = await this.mediaUploadService.storeImage(logoValue, 'organization')

        if (storedLogo) {
            data.logo = storedLogo
        } else if (logoValue.startsWith('data:image')) {
            delete data.logo
        }

        return data
    }
}
