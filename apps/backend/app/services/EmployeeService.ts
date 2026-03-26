import Employee from '#models/employee'
import { Exception } from '@adonisjs/core/exceptions'

export default class EmployeeService {
    /**
     * List all employees in organization
     */
    async list(orgId: number, filters: any = {}) {
        const query = Employee.query()
            .where('org_id', orgId)
            .whereNull('deleted_at')

        // Search filter
        if (filters.search) {
            const search = `%${filters.search}%`
            query.where((q) => {
                q.where('first_name', 'like', search)
                    .orWhere('last_name', 'like', search)
                    .orWhere('email', 'like', search)
                    .orWhere('employee_code', 'like', search)
            })
        }

        // Exact filters
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

    /**
     * Get employee by ID
     */
    async getById(id: number, orgId: number) {
        // First check if employee exists at all
        const employeeExists = await Employee.query()
            .where('id', id)
            .first()

        if (!employeeExists) {
            throw new Exception('Employee not found. The employee may have been deleted or never existed.', { status: 404 })
        }

        // Check if employee belongs to user's organization
        if (employeeExists.orgId !== orgId) {
            throw new Exception('Employee not found in your organization', { status: 404 })
        }

        // Check if employee is soft-deleted
        if (employeeExists.deletedAt) {
            throw new Exception('Employee has been removed from the organization', { status: 404 })
        }

        const employee = await Employee.query()
            .where('id', id)
            .where('org_id', orgId)
            .whereNull('deleted_at')
            .preload('department')
            .preload('designation')
            .preload('role')
            .first()

        return employee
    }

    /**
     * Create new employee
     */
    async create(orgId: number, data: any) {
        const payload = this.parseEmployeeData(data)
        return await Employee.create({ ...payload, orgId })
    }

    /**
     * Update employee
     */
    async update(id: number, orgId: number, data: any) {
        const employee = await this.getById(id, orgId)
        const payload = this.parseEmployeeData(data)
        employee.merge(payload)
        await employee.save()
        return employee
    }

    private parseEmployeeData(data: any) {
        const payload = { ...data }

        // Convert date strings to DateTime objects
        if (payload.joinDate && typeof payload.joinDate === 'string') {
            payload.joinDate = DateTime.fromISO(payload.joinDate)
        }
        if (payload.dateOfBirth && typeof payload.dateOfBirth === 'string') {
            payload.dateOfBirth = DateTime.fromISO(payload.dateOfBirth)
        }
        if (payload.exitDate && typeof payload.exitDate === 'string') {
            payload.exitDate = DateTime.fromISO(payload.exitDate)
        }

        return payload
    }

    /**
     * Soft delete employee
     */
    async delete(id: number, orgId: number, deletedBy: number) {
        const employee = await this.getById(id, orgId)
        employee.deletedAt = DateTime.now()
        employee.deletedBy = deletedBy
        await employee.save()
    }
}

import { DateTime } from 'luxon'
