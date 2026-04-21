import Employee from '#models/employee'
import Organization from '#models/organization'
import OrganizationSetting from '#models/organization_setting'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import AuthorizationService from '#services/AuthorizationService'

export default class EmployeeService {
    private readonly employeeCodePrefixKey = 'employee-code-prefix'

    private isDuplicateEntryError(error: any) {
        return error?.code === 'ER_DUP_ENTRY' || String(error?.message || '').toLowerCase().includes('duplicate entry')
    }

    private normalizeEmployeeCodePrefix(value: unknown): string {
        const normalized = String(value ?? '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 3)

        return normalized.length === 3 ? normalized : ''
    }

    private normalizeEmployeeCode(value: unknown): string | null {
        const normalized = String(value ?? '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, '')
            .slice(0, 30)

        return normalized || null
    }

    private async getEmployeeCodePrefix(orgId: number): Promise<string> {
        const record = await OrganizationSetting.query()
            .where('org_id', orgId)
            .where('setting_key', this.employeeCodePrefixKey)
            .first()

        if (record?.settingValue) {
            try {
                const parsed = JSON.parse(record.settingValue)
                const rawValue = Array.isArray(parsed) ? parsed[0]?.value ?? parsed[0]?.prefix ?? parsed[0] : parsed
                const savedPrefix = this.normalizeEmployeeCodePrefix(rawValue)
                if (savedPrefix) {
                    return savedPrefix
                }
            } catch {
                const fallbackSavedPrefix = this.normalizeEmployeeCodePrefix(record.settingValue)
                if (fallbackSavedPrefix) {
                    return fallbackSavedPrefix
                }
            }
        }

        const organization = await Organization.query().where('id', orgId).first()
        const fallbackPrefix = this.normalizeEmployeeCodePrefix(organization?.companyName)
        return fallbackPrefix || 'EMP'
    }

    private async generateEmployeeCode(orgId: number): Promise<string> {
        const prefix = await this.getEmployeeCodePrefix(orgId)

        for (let attempt = 0; attempt < 25; attempt += 1) {
            const random = Math.floor(1000 + Math.random() * 9000)
            const code = `${prefix}-${random}`
            const existing = await Employee.query()
                .where('org_id', orgId)
                .where('employee_code', code)
                .whereNull('deleted_at')
                .first()

            if (!existing) {
                return code
            }
        }

        throw new Exception('Unable to generate a unique employee code right now. Please try again.', { status: 503 })
    }

    private async assertUniqueEmployeeFields(orgId: number, data: any, employeeId?: number) {
        const normalizedEmail = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : null
        const normalizedEmployeeCode = typeof data?.employeeCode === 'string' ? data.employeeCode.trim() : null

        if (normalizedEmail) {
            const emailQuery = Employee.query()
                .whereRaw('LOWER(email) = ?', [normalizedEmail])
                .whereNull('deleted_at')

            if (employeeId) {
                emailQuery.whereNot('id', employeeId)
            }

            const emailOwner = await emailQuery.first()
            if (emailOwner) {
                if (emailOwner.orgId === orgId) {
                    throw new Exception('An employee with this email already exists in your organization', { status: 409 })
                }

                throw new Exception('This email is already linked to another employee account and cannot be reused', { status: 409 })
            }
        }

        if (normalizedEmployeeCode) {
            const codeQuery = Employee.query()
                .where('org_id', orgId)
                .where('employee_code', normalizedEmployeeCode)
                .whereNull('deleted_at')

            if (employeeId) {
                codeQuery.whereNot('id', employeeId)
            }

            const codeOwner = await codeQuery.first()
            if (codeOwner) {
                throw new Exception('An employee with this employee code already exists in your organization', { status: 409 })
            }
        }
    }

    async list(orgId: number, filters: any = {}, actor?: Employee, authorizationService?: AuthorizationService) {
        const query = Employee.query()
            .where('org_id', orgId)
            .whereNull('deleted_at')

        if (actor && authorizationService) {
            if (!actor.role) {
                await actor.load('role')
            }
            authorizationService.scopeEmployeesQuery(query, actor)
        }

        if (filters.search) {
            const search = `%${filters.search}%`
            query.where((q) => {
                q.where('first_name', 'like', search)
                    .orWhere('last_name', 'like', search)
                    .orWhere('email', 'like', search)
                    .orWhere('employee_code', 'like', search)
            })
        }

        if (filters.status) {
            query.where('status', filters.status)
        }

        if (filters.departmentId) {
            query.where('department_id', filters.departmentId)
        }

        if (filters.roleId) {
            query.where('role_id', filters.roleId)
        }

        return await query.preload('department').preload('designation').preload('role')
    }

    async getById(id: number, orgId: number) {
        const employee = await Employee.query()
            .where('id', id)
            .where('org_id', orgId)
            .whereNull('deleted_at')
            .preload('department')
            .preload('designation')
            .preload('role')
            .first()

        return employee ?? null
    }

    async create(orgId: number, data: any) {
        const payload = this.parseEmployeeData(data)

        // Enforce plan user limit
        const organization = await Organization.findOrFail(orgId)
        const activeCount = await Employee.query()
            .where('org_id', orgId)
            .whereNull('deleted_at')
            .count('* as total')
            .first()
        
        const count = Number(activeCount?.$extras.total || 0)
        if (count >= organization.userLimit) {
            throw new Exception(
                `Workspace limit reached (${organization.userLimit} seats). Please upgrade your plan to add more employees.`, 
                { status: 403 }
            )
        }

        if (!payload.employeeCode) {
            payload.employeeCode = await this.generateEmployeeCode(orgId)
        }

        await this.assertUniqueEmployeeFields(orgId, payload)

        try {
            return await Employee.create({ ...payload, orgId })
        } catch (error: any) {
            if (this.isDuplicateEntryError(error)) {
                throw new Exception('An employee with the same email or employee code already exists', { status: 409 })
            }
            throw error
        }
    }

    async update(id: number, orgId: number, data: any) {
        const employee = await this.getById(id, orgId)
        if (!employee) {
            throw new Exception('Employee not found in your organization', { status: 404 })
        }

        const payload = this.parseEmployeeData(data)
        if (!payload.employeeCode) {
            payload.employeeCode = employee.employeeCode || (await this.generateEmployeeCode(orgId))
        }

        await this.assertUniqueEmployeeFields(orgId, payload, employee.id)
        employee.merge(payload)

        try {
            await employee.save()
        } catch (error: any) {
            if (this.isDuplicateEntryError(error)) {
                throw new Exception('An employee with the same email or employee code already exists', { status: 409 })
            }
            throw error
        }

        return employee
    }

    private parseEmployeeData(data: any) {
        const payload = { ...data }

        if (payload.joinDate && typeof payload.joinDate === 'string') {
            payload.joinDate = DateTime.fromISO(payload.joinDate)
        }
        if (payload.dateOfBirth && typeof payload.dateOfBirth === 'string') {
            payload.dateOfBirth = DateTime.fromISO(payload.dateOfBirth)
        }
        if (payload.exitDate && typeof payload.exitDate === 'string') {
            payload.exitDate = DateTime.fromISO(payload.exitDate)
        }
        if ('employeeCode' in payload) {
            payload.employeeCode = this.normalizeEmployeeCode(payload.employeeCode)
        }

        return payload
    }

    async delete(id: number, orgId: number, deletedBy: number) {
        const employee = await this.getById(id, orgId)
        if (!employee) {
            throw new Exception('Employee not found in your organization', { status: 404 })
        }
        employee.deletedAt = DateTime.now()
        employee.deletedBy = deletedBy
        await employee.save()
    }
}
