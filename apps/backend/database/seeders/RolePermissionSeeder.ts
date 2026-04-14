import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

type PermissionSeed = {
  key: string
  module: string
  resource: string
  action: string
  description: string
}

export default class extends BaseSeeder {
  private readonly permissions: PermissionSeed[] = [
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

  private readonly rolePermissionMap: Record<number, string[]> = {
    1: this.permissions.map((item) => item.key),
    2: [
      'employee_create', 'employee_read', 'employee_update', 'employee_delete',
      'attendance_create', 'attendance_read', 'attendance_update', 'attendance_approve',
      'leave_create', 'leave_read', 'leave_update', 'leave_approve', 'leave_reject', 'leave_process',
      'payroll_read', 'payroll_process', 'payroll_export',
      'recruitment_create', 'recruitment_read',
      'performance_read', 'performance_update',
      'reports_read', 'reports_export',
      'settings_read', 'rbac_manage',
    ],
    3: [
      'employee_read', 'employee_update',
      'attendance_read', 'attendance_update', 'attendance_approve',
      'leave_create', 'leave_read', 'leave_update', 'leave_approve', 'leave_reject',
      'recruitment_create', 'recruitment_read',
      'performance_read', 'performance_update',
      'reports_read',
      'settings_read',
    ],
    4: [
      'employee_read',
      'attendance_read', 'attendance_approve',
      'leave_read', 'leave_approve', 'leave_reject',
      'performance_read',
      'reports_read',
    ],
    5: [
      'attendance_read',
      'leave_create', 'leave_read', 'leave_update',
      'payroll_read',
    ],
    6: [
      'employee_read',
      'payroll_read', 'payroll_process', 'payroll_export',
      'reports_read', 'reports_export',
    ],
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

  async run() {
    const hasPermissionsTable = await this.hasTable('permissions')
    const hasRolePermissionsTable = await this.hasTable('role_permissions')
    const hasPermissionKey = hasPermissionsTable && await this.hasColumn('permissions', 'permission_key')

    if (!hasPermissionsTable || !hasRolePermissionsTable || !hasPermissionKey) {
      return
    }

    const hasResource = await this.hasColumn('permissions', 'resource')
    const hasAction = await this.hasColumn('permissions', 'action')
    const hasIsSystem = await this.hasColumn('permissions', 'is_system')
    const hasCreatedAt = await this.hasColumn('permissions', 'created_at')
    const hasUpdatedAt = await this.hasColumn('permissions', 'updated_at')
    const now = new Date()

    const permissionIds = new Map<string, number>()

    for (const permission of this.permissions) {
      const existing = await db
        .from('permissions')
        .where('permission_key', permission.key)
        .select('id')
        .first()

      const payload: Record<string, any> = {
        permission_key: permission.key,
        module: permission.module,
        description: permission.description,
      }

      if (hasResource) payload.resource = permission.resource
      if (hasAction) payload.action = permission.action
      if (hasIsSystem) payload.is_system = true
      if (hasCreatedAt && !existing) payload.created_at = now
      if (hasUpdatedAt) payload.updated_at = now

      if (existing) {
        await db.from('permissions').where('id', existing.id).update(payload)
        permissionIds.set(permission.key, Number(existing.id))
      } else {
        const inserted = await db.table('permissions').insert(payload)
        const permissionId = Array.isArray(inserted) ? Number(inserted[0]) : Number(inserted)
        permissionIds.set(permission.key, permissionId)
      }
    }

    for (const [roleId, permissionKeys] of Object.entries(this.rolePermissionMap)) {
      for (const permissionKey of permissionKeys) {
        const permissionId = permissionIds.get(permissionKey)
        if (!permissionId) continue

        const existing = await db
          .from('role_permissions')
          .where('role_id', Number(roleId))
          .where('permission_id', permissionId)
          .first()

        if (!existing) {
          await db.table('role_permissions').insert({
            role_id: Number(roleId),
            permission_id: permissionId,
            granted_by: null,
            granted_at: now,
          })
        }
      }
    }
  }
}
