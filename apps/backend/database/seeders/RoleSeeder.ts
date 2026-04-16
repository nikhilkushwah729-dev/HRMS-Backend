import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  private async hasColumn(columnName: string): Promise<boolean> {
    const result = await db.rawQuery(
      'select 1 as present from information_schema.columns where table_schema = database() and table_name = ? and column_name = ? limit 1',
      ['roles', columnName]
    )
    return Array.isArray(result.rows) && result.rows.length > 0
  }

  async run() {
    const now = new Date()
    const hasDescription = await this.hasColumn('description')
    const hasPriority = await this.hasColumn('priority')
    const hasIsActive = await this.hasColumn('is_active')
    const hasParentRoleId = await this.hasColumn('parent_role_id')
    const hasCreatedAt = await this.hasColumn('created_at')
    const hasUpdatedAt = await this.hasColumn('updated_at')

    const roles = [
      {
        id: 1,
        org_id: null,
        role_name: 'Super Admin',
        description: 'Full system access across all modules and organizations.',
        is_system: true,
        priority: 1,
        is_active: true,
        parent_role_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        org_id: null,
        role_name: 'Admin',
        description: 'Organization administrator access with broad operational control.',
        is_system: true,
        priority: 2,
        is_active: true,
        parent_role_id: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        org_id: null,
        role_name: 'HR Manager',
        description: 'HR management access for workforce operations and approvals.',
        is_system: true,
        priority: 3,
        is_active: true,
        parent_role_id: 2,
        created_at: now,
        updated_at: now,
      },
      {
        id: 4,
        org_id: null,
        role_name: 'Manager',
        description: 'Team-level access for approvals, attendance, and reporting.',
        is_system: true,
        priority: 4,
        is_active: true,
        parent_role_id: 3,
        created_at: now,
        updated_at: now,
      },
      {
        id: 5,
        org_id: null,
        role_name: 'Employee',
        description: 'Self-service access for attendance, leave, payroll, and requests.',
        is_system: true,
        priority: 5,
        is_active: true,
        parent_role_id: 4,
        created_at: now,
        updated_at: now,
      },
      {
        id: 6,
        org_id: null,
        role_name: 'Finance',
        description: 'Finance and payroll processing access with restricted employee visibility.',
        is_system: true,
        priority: 3,
        is_active: true,
        parent_role_id: 2,
        created_at: now,
        updated_at: now,
      },
    ]

    for (const role of roles) {
      const existing = await db.from('roles').where('id', role.id).select('id').first()

      if (existing) {
        const updatePayload: Record<string, any> = {
          role_name: role.role_name,
          is_system: role.is_system,
        }

        if (hasDescription) updatePayload.description = role.description
        if (hasPriority) updatePayload.priority = role.priority
        if (hasIsActive) updatePayload.is_active = role.is_active
        if (hasParentRoleId) updatePayload.parent_role_id = role.parent_role_id
        if (hasUpdatedAt) updatePayload.updated_at = role.updated_at

        await db.from('roles').where('id', role.id).update(updatePayload)
      } else {
        const insertPayload: Record<string, any> = {
          id: role.id,
          org_id: role.org_id,
          role_name: role.role_name,
          is_system: role.is_system,
        }

        if (hasDescription) insertPayload.description = role.description
        if (hasPriority) insertPayload.priority = role.priority
        if (hasIsActive) insertPayload.is_active = role.is_active
        if (hasParentRoleId) insertPayload.parent_role_id = role.parent_role_id
        if (hasCreatedAt) insertPayload.created_at = role.created_at
        if (hasUpdatedAt) insertPayload.updated_at = role.updated_at

        await db.table('roles').insert(insertPayload)
      }
    }
  }
}
