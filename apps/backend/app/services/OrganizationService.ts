import Organization from '#models/organization'
import Department from '#models/department'
import Designation from '#models/designation'
import AddonPrice from '#models/addon_price'
import OrganizationAddon from '#models/organization_addon'
import OrganizationSetting from '#models/organization_setting'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

export default class OrganizationService {
    /**
     * Get organization details
     */
    async getById(id: number) {
        const org = await Organization.query()
            .where('id', id)
            .preload('plan')
            .preload('departments')
            .first()

        if (!org) {
            throw new Exception('Organization not found', { status: 404 })
        }

        return org
    }

    /**
     * Create a new organization (Onboarding)
     */
    async create(data: any) {
        return await Organization.create(data)
    }

    /**
     * Update organization
     */
    async update(id: number, data: any) {
        const org = await this.getById(id)
        org.merge(data)
        await org.save()
        return org
    }

    /**
     * Manage Departments
     */
    async addDepartment(orgId: number, data: any) {
        const { name, ...rest } = data
        return await Department.create({ ...rest, departmentName: name, orgId })
    }

    async updateDepartment(orgId: number, departmentId: number, data: any) {
        const department = await Department.query()
            .where('org_id', orgId)
            .where('id', departmentId)
            .first()

        if (!department) {
            throw new Exception('Department not found', { status: 404 })
        }

        department.merge({
            departmentName: data.name ?? department.departmentName,
            parentId: data.parentId ?? department.parentId,
            description: data.description ?? department.description,
            isActive: data.isActive ?? department.isActive,
        })
        await department.save()
        return department
    }

    async deleteDepartment(orgId: number, departmentId: number) {
        const department = await Department.query()
            .where('org_id', orgId)
            .where('id', departmentId)
            .first()

        if (!department) {
            throw new Exception('Department not found', { status: 404 })
        }

        await department.delete()
        return true
    }

    async getDepartments(orgId: number) {
        return await Department.query().where('org_id', orgId).preload('designations')
    }

    /**
     * Manage Designations
     */
    async getDesignations(orgId: number) {
        return await Designation.query().where('org_id', orgId)
    }

    async addDesignation(orgId: number, departmentId: number | null, data: any) {
        return await Designation.create({ ...data, orgId, departmentId })
    }

    async updateDesignation(orgId: number, designationId: number, data: any) {
        const designation = await Designation.query()
            .where('org_id', orgId)
            .where('id', designationId)
            .first()

        if (!designation) {
            throw new Exception('Designation not found', { status: 404 })
        }

        designation.merge({
            designationName: data.name ?? designation.designationName,
            departmentId: data.departmentId ?? designation.departmentId,
        })
        await designation.save()
        return designation
    }

    async deleteDesignation(orgId: number, designationId: number) {
        const designation = await Designation.query()
            .where('org_id', orgId)
            .where('id', designationId)
            .first()

        if (!designation) {
            throw new Exception('Designation not found', { status: 404 })
        }

        await designation.delete()
        return true
    }

    /**
     * Generic Settings Storage
     */
    async getSettingCollection(orgId: number, settingKey: string) {
        const record = await OrganizationSetting.query()
            .where('org_id', orgId)
            .where('setting_key', settingKey)
            .first()

        if (!record) {
            return []
        }

        try {
            const parsed = JSON.parse(record.settingValue)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }

    async saveSettingCollection(orgId: number, settingKey: string, items: unknown[]) {
        const serialized = JSON.stringify(Array.isArray(items) ? items : [])
        let record = await OrganizationSetting.query()
            .where('org_id', orgId)
            .where('setting_key', settingKey)
            .first()

        if (record) {
            record.settingValue = serialized
            await record.save()
            return Array.isArray(items) ? items : []
        }

        await OrganizationSetting.create({
            orgId,
            settingKey,
            settingValue: serialized,
        })

        return Array.isArray(items) ? items : []
    }

    /**
     * Manage Addons (Modules)
     */
    async getAddons(orgId: number) {
        const allAddons = await AddonPrice.query().where('isActive', true)
        const orgAddons = await OrganizationAddon.query().where('orgId', orgId)

        return allAddons.map(addon => {
            const orgAddon = orgAddons.find(oa => oa.addonId === addon.id)
            return {
                id: addon.id,
                name: addon.name,
                slug: addon.slug,
                description: `Manage ${addon.name} module`,
                isActive: orgAddon ? orgAddon.isActive : false
            }
        })
    }

    async toggleAddon(orgId: number, addonId: number, isActive: boolean) {
        let orgAddon = await OrganizationAddon.query()
            .where('orgId', orgId)
            .where('addonId', addonId)
            .first()

        if (orgAddon) {
            orgAddon.isActive = isActive
            await orgAddon.save()
        } else if (isActive) {
            orgAddon = await OrganizationAddon.create({
                orgId,
                addonId,
                isActive: true,
                startDate: DateTime.now()
            })
        }
        return orgAddon
    }
}
