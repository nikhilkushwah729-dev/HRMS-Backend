import { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'
import Employee from '#models/employee'
import Permission from '#models/permission'
import Role from '#models/role'
import UserPermission from '#models/user_permission'
import db from '@adonisjs/lucid/services/db'

export type AccessScope = 'all' | 'team' | 'self' | 'finance'

export type AccessProfile = {
  roleId: number | null
  roleName: string
  scope: AccessScope
  permissionKeys: string[]
}

export default class AuthorizationService {
  private permissionCatalogReady: boolean | null = null
  private userPermissionOverridesReady: boolean | null = null
  private roleCatalogReady: boolean | null = null

  private roleNameFromId(roleId: number | null | undefined): string {
    const builtIn: Record<number, string> = {
      1: 'Super Admin',
      2: 'Organization Admin',
      3: 'HR Manager',
      4: 'Manager',
      5: 'Employee',
    }

    return builtIn[Number(roleId ?? 0)] ?? ''
  }

  private normalizedRoleName(employee: Employee, role?: Role | null): string {
    return String(
      role?.roleName || employee.role?.roleName || this.roleNameFromId(employee.roleId)
    )
      .trim()
      .toLowerCase()
  }

  private isPlatformSuperAdmin(employee: Employee, role?: Role | null): boolean {
    const roleName = this.normalizedRoleName(employee, role)
    return (roleName === 'super admin' || roleName.includes('tum') || Number(employee.roleId ?? 0) === 1) && (role?.orgId === null || employee.role?.orgId === null || employee.orgId === null)
  }

  private isOrgFullAccessRole(employee: Employee, role?: Role | null): boolean {
    const roleName = this.normalizedRoleName(employee, role)
    const roleId = Number(employee.roleId ?? role?.id ?? 0)
    return [1, 2, 3].includes(roleId) ||
      roleName.includes('organization admin') ||
      roleName === 'admin' ||
      roleName.includes('admin') ||
      roleName.includes('hr manager') ||
      roleName.includes('hr admin') ||
      roleName.includes('human resource') ||
      this.isPlatformSuperAdmin(employee, role)
  }

  private isManagerRole(employee: Employee, role?: Role | null): boolean {
    const roleName = this.normalizedRoleName(employee, role)
    return roleName === 'manager' || (roleName.includes('manager') && !roleName.includes('hr manager'))
  }

  private isFullAccessRoleName(roleName: string): boolean {
    const normalized = String(roleName || '').trim().toLowerCase()
    return normalized === 'super admin' ||
      normalized.includes('tum') ||
      normalized === 'organization admin' ||
      normalized === 'admin' ||
      normalized.includes('admin') ||
      normalized.includes('hr manager') ||
      normalized.includes('hr admin') ||
      normalized.includes('human resource')
  }

  async normalizeLegacyOrganizationRole(employee: Employee): Promise<Employee> {
    await employee.load('role')

    if (!employee.role) {
      return employee
    }

    const roleName = String(employee.role.roleName || '').trim().toLowerCase()
    const roleOrgId = employee.role.orgId

    // Only platform/global Super Admin should remain Super Admin.
    if (roleName !== 'super admin' || roleOrgId == null) {
      return employee
    }

    let adminRole = await Role.query()
      .where('role_name', 'Organization Admin')
      .where((query) => {
        query.where('org_id', employee.orgId).orWhereNull('org_id')
      })
      .orderByRaw('CASE WHEN org_id IS NULL THEN 1 ELSE 0 END')
      .first()

    if (!adminRole) {
      const [createdRoleId] = await db.table('roles').insert({
        org_id: employee.orgId,
        role_name: 'Organization Admin',
        is_system: true,
      })

      adminRole = await Role.find(createdRoleId)
    }

    if (!adminRole) {
      throw new Error(`Unable to provision Admin role for organization ${employee.orgId}`)
    }

    employee.roleId = adminRole.id
    await employee.save()
    await employee.load('role')

    return employee
  }

  private async hasTable(tableName: string): Promise<boolean> {
    const result = await db.rawQuery(
      'select 1 as present from information_schema.tables where table_schema = database() and table_name = ? limit 1',
      [tableName]
    )
    return Array.isArray(result.rows) && result.rows.length > 0
  }

  private async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    const result = await db.rawQuery(
      'select 1 as present from information_schema.columns where table_schema = database() and table_name = ? and column_name = ? limit 1',
      [tableName, columnName]
    )
    return Array.isArray(result.rows) && result.rows.length > 0
  }

  private readonly canonicalPermissionCatalog: Array<{
    key: string
    module: string
    resource: string
    action: string
    description: string
  }> = [
    { key: 'employee_create', module: 'employee_management', resource: 'employee', action: 'create', description: 'Create employee records' },
    { key: 'employee_read', module: 'employee_management', resource: 'employee', action: 'read', description: 'View employee records' },
    { key: 'employee_update', module: 'employee_management', resource: 'employee', action: 'update', description: 'Update employee records' },
    { key: 'employee_delete', module: 'employee_management', resource: 'employee', action: 'delete', description: 'Delete employee records' },
    { key: 'attendance_create', module: 'attendance', resource: 'attendance', action: 'create', description: 'Create attendance events' },
    { key: 'attendance_read', module: 'attendance', resource: 'attendance', action: 'read', description: 'View attendance data' },
    { key: 'attendance_update', module: 'attendance', resource: 'attendance', action: 'update', description: 'Update attendance data' },
    { key: 'attendance_approve', module: 'attendance', resource: 'attendance', action: 'approve', description: 'Approve attendance corrections' },
    { key: 'leave_create', module: 'leave_management', resource: 'leave', action: 'create', description: 'Apply for leave' },
    { key: 'leave_read', module: 'leave_management', resource: 'leave', action: 'read', description: 'View leave records' },
    { key: 'leave_update', module: 'leave_management', resource: 'leave', action: 'update', description: 'Update leave records' },
    { key: 'leave_approve', module: 'leave_management', resource: 'leave', action: 'approve', description: 'Approve leave requests' },
    { key: 'leave_reject', module: 'leave_management', resource: 'leave', action: 'reject', description: 'Reject leave requests' },
    { key: 'leave_process', module: 'leave_management', resource: 'leave_balance', action: 'process', description: 'Adjust leave balances' },
    { key: 'payroll_read', module: 'payroll', resource: 'payroll', action: 'read', description: 'View payroll data' },
    { key: 'payroll_process', module: 'payroll', resource: 'payroll', action: 'process', description: 'Process payroll runs' },
    { key: 'payroll_export', module: 'payroll', resource: 'payroll', action: 'export', description: 'Export payroll reports' },
    { key: 'recruitment_create', module: 'recruitment', resource: 'recruitment', action: 'create', description: 'Create recruitment records' },
    { key: 'recruitment_read', module: 'recruitment', resource: 'recruitment', action: 'read', description: 'View recruitment records' },
    { key: 'performance_read', module: 'performance_management', resource: 'performance', action: 'read', description: 'View performance data' },
    { key: 'performance_update', module: 'performance_management', resource: 'performance', action: 'update', description: 'Update performance reviews' },
    { key: 'reports_read', module: 'reports_analytics', resource: 'report', action: 'read', description: 'View analytics and reports' },
    { key: 'reports_export', module: 'reports_analytics', resource: 'report', action: 'export', description: 'Export analytics and reports' },
    { key: 'settings_read', module: 'settings', resource: 'setting', action: 'read', description: 'View settings and configuration' },
    { key: 'settings_update', module: 'settings', resource: 'setting', action: 'update', description: 'Update settings and configuration' },
    { key: 'rbac_manage', module: 'settings', resource: 'rbac', action: 'manage', description: 'Manage roles and permissions' },
    { key: 'impersonation_use', module: 'settings', resource: 'impersonation', action: 'use', description: 'Use supervised impersonation' },
  ]

  private readonly legacyAliases: Record<string, string[]> = {
    employee_read: ['employees.view'],
    attendance_read: ['attendance.view'],
    leave_read: ['leaves.view'],
    leave_approve: ['leaves.approve'],
    payroll_read: ['payroll.view'],
    reports_read: ['reports.view'],
    reports_export: ['reports.view'],
    settings_read: ['settings.view'],
    settings_update: ['settings.view'],
    rbac_manage: ['roles.view'],
  }

  private readonly systemRoles: Array<{
    id: number
    orgId: number | null
    roleName: string
    isSystem: boolean
    description: string
    priority: number
    isActive: boolean
    parentRoleId: number | null
  }> = [
    {
      id: 1,
      orgId: null,
      roleName: 'Super Admin',
      isSystem: true,
      description: 'Platform owner with full global control across all organizations.',
      priority: 1,
      isActive: true,
      parentRoleId: null,
    },
    {
      id: 2,
      orgId: null,
      roleName: 'Organization Admin',
      isSystem: true,
      description: 'Organization administrator managing employees, settings, hierarchy, and HR operations within their company.',
      priority: 2,
      isActive: true,
      parentRoleId: 1,
    },
    {
      id: 3,
      orgId: null,
      roleName: 'HR Manager',
      isSystem: true,
      description: 'Organization HR role responsible for employee lifecycle, approvals, attendance, and payroll workflows.',
      priority: 3,
      isActive: true,
      parentRoleId: 2,
    },
    {
      id: 4,
      orgId: null,
      roleName: 'Manager',
      isSystem: true,
      description: 'Team manager with reportee visibility and approval authority for team workflows.',
      priority: 4,
      isActive: true,
      parentRoleId: 3,
    },
    {
      id: 5,
      orgId: null,
      roleName: 'Employee',
      isSystem: true,
      description: 'Regular employee with self-service access to attendance and leave.',
      priority: 5,
      isActive: true,
      parentRoleId: 4,
    },
  ]

  async ensureCatalogSeeded(): Promise<void> {
    await this.ensureSystemRolesSeeded()

    if (this.permissionCatalogReady === false) return

    const hasPermissionsTable = await this.hasTable('permissions')
    const hasRolePermissionsTable = await this.hasTable('role_permissions')
    const hasPermissionKey = hasPermissionsTable
      ? await this.hasColumn('permissions', 'permission_key')
      : false

    if (!hasPermissionsTable || !hasRolePermissionsTable || !hasPermissionKey) {
      this.permissionCatalogReady = false
      return
    }

    this.permissionCatalogReady = true

    for (const item of this.canonicalPermissionCatalog) {
      await Permission.updateOrCreate(
        { permissionKey: item.key },
        {
          permissionKey: item.key,
          module: item.module,
          resource: item.resource,
          action: item.action,
          description: item.description,
          isSystem: true,
        }
      )
    }
  }

  async ensureSystemRolesSeeded(): Promise<void> {
    if (this.roleCatalogReady === false) return

    const hasRolesTable = await this.hasTable('roles')
    if (!hasRolesTable) {
      this.roleCatalogReady = false
      return
    }

    const hasDescription = await this.hasColumn('roles', 'description')
    const hasPriority = await this.hasColumn('roles', 'priority')
    const hasIsActive = await this.hasColumn('roles', 'is_active')
    const hasParentRoleId = await this.hasColumn('roles', 'parent_role_id')

    this.roleCatalogReady = true

    for (const role of this.systemRoles) {
      const payload: Record<string, any> = {
        id: role.id,
        orgId: role.orgId,
        roleName: role.roleName,
        isSystem: role.isSystem,
      }

      if (hasDescription) payload.description = role.description
      if (hasPriority) payload.priority = role.priority
      if (hasIsActive) payload.isActive = role.isActive
      if (hasParentRoleId) payload.parentRoleId = role.parentRoleId

      await Role.updateOrCreate({ id: role.id }, payload)
    }
  }

  private roleNameFor(employee: Employee, role?: Role | null): string {
    const explicitRoleName = String(role?.roleName || employee.role?.roleName || '').trim()
    if (explicitRoleName) return explicitRoleName

    const roleId = Number(employee.roleId ?? 0)
    const builtIn: Record<number, string> = {
      1: 'Super Admin',
      2: 'Organization Admin',
      3: 'HR Manager',
      4: 'Manager',
      5: 'Employee',
    }
    return builtIn[roleId] ?? 'Employee'
  }

  private scopeFor(employee: Employee, role?: Role | null): AccessScope {
    if (this.isPlatformSuperAdmin(employee, role)) return 'all'
    if (this.isOrgFullAccessRole(employee, role)) return 'all'
    if (this.isManagerRole(employee, role)) return 'team'
    return 'self'
  }

  async getPermissionKeys(employee: Employee): Promise<string[]> {
    if (this.permissionCatalogReady === null) {
      await this.ensureCatalogSeeded()
    }

    if (this.permissionCatalogReady === false) {
      return []
    }

    await employee.load('role')
    if (!employee.roleId) {
      return []
    }
    const role = await Role.query()
      .where('id', employee.roleId)
      .preload('permissions')
      .first()

    const keys = new Set<string>()
    role?.permissions.forEach((permission) => {
      const key = String(permission.permissionKey || '').trim()
      if (key) {
        keys.add(key)
      }
    })

    if (this.userPermissionOverridesReady === null) {
      this.userPermissionOverridesReady = await this.hasTable('user_permissions')
    }

    if (this.userPermissionOverridesReady) {
      const now = DateTime.now()
      const userOverrides = await UserPermission.query()
        .where('employee_id', employee.id)
        .preload('permission')
        .where((query) => {
          query.whereNull('starts_at').orWhere('starts_at', '<=', now.toSQL()!)
        })
        .where((query) => {
          query.whereNull('ends_at').orWhere('ends_at', '>=', now.toSQL()!)
        })

      userOverrides.forEach((override) => {
        const key = String(override.permission?.permissionKey || '').trim()
        if (!key) return
        if (override.effect === 'deny') {
          keys.delete(key)
        } else {
          keys.add(key)
        }
      })
    }

    return Array.from(keys)
  }

  private includesPermission(permissionKeys: string[], key: string): boolean {
    if (permissionKeys.includes(key)) return true
    return (this.legacyAliases[key] || []).some((alias) => permissionKeys.includes(alias))
  }

  async getAccessProfile(employee: Employee): Promise<AccessProfile> {
    const permissionKeys = await this.getPermissionKeys(employee)
    const role = employee.roleId ? await Role.find(employee.roleId) : null
    return {
      roleId: employee.roleId ?? null,
      roleName: this.roleNameFor(employee, role),
      scope: this.scopeFor(employee, role),
      permissionKeys,
    }
  }

  async hasPermission(employee: Employee, permissionKey: string): Promise<boolean> {
    const profile = await this.getAccessProfile(employee)
    if (this.isFullAccessRoleName(profile.roleName)) return true
    return this.includesPermission(profile.permissionKeys, permissionKey)
  }

  async ensurePermission(employee: Employee, permissionKey: string): Promise<boolean> {
    return this.hasPermission(employee, permissionKey)
  }

  async canAccessEmployee(actor: Employee, subject: Employee): Promise<boolean> {
    await actor.load('role')
    if (this.isPlatformSuperAdmin(actor, actor.role)) return true
    if (actor.orgId !== subject.orgId) return false
    const scope = this.scopeFor(actor)
    if (scope === 'all' || scope === 'finance') return true
    if (scope === 'self') return actor.id === subject.id
    return actor.id === subject.id || subject.managerId === actor.id
  }

  scopeEmployeesQuery(query: ModelQueryBuilderContract<typeof Employee>, actor: Employee) {
    const scope = this.scopeFor(actor, actor.role)

    if (!this.isPlatformSuperAdmin(actor, actor.role)) {
      query.where('org_id', actor.orgId)
    }

    if (scope === 'all' || scope === 'finance') {
      return query
    }

    if (scope === 'team') {
      query.where((builder) => {
        builder.where('id', actor.id).orWhere('manager_id', actor.id)
      })
      return query
    }

    query.where('id', actor.id)
    return query
  }

  sanitizeEmployeeData(record: Record<string, any>, actor: Employee) {
    const scope = this.scopeFor(actor)
    const clone = { ...record }

    if (scope === 'finance') {
      clone.dateOfBirth = null
      clone.address = null
      clone.emergencyContact = null
      clone.emergencyPhone = null
      clone.bankAccount = clone.bankAccount ? `****${String(clone.bankAccount).slice(-4)}` : null
      clone.panNumber = clone.panNumber ? `******${String(clone.panNumber).slice(-4)}` : null
    }

    if (scope === 'self') {
      return clone
    }

    return clone
  }
}
