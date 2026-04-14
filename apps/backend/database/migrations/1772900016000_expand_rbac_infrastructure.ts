import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected rolesTableName = 'roles'
  protected permissionsTableName = 'permissions'
  protected userPermissionsTableName = 'user_permissions'

  async up() {
    this.schema.alterTable(this.rolesTableName, (table) => {
      table.string('description', 255).nullable().after('role_name')
      table.integer('parent_role_id').unsigned().nullable().after('description')
      table
        .foreign('parent_role_id', 'roles_parent_role_fk')
        .references('id')
        .inTable('roles')
        .onDelete('SET NULL')
      table.integer('priority').notNullable().defaultTo(100).after('is_system')
      table.boolean('is_active').notNullable().defaultTo(true).after('priority')
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.index(['org_id', 'is_active'], 'roles_org_active_idx')
    })

    this.schema.alterTable(this.permissionsTableName, (table) => {
      table.string('resource', 100).nullable().after('module')
      table.string('action', 100).nullable().after('resource')
      table.boolean('is_system').notNullable().defaultTo(true).after('action')
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.index(['module', 'action'], 'permissions_module_action_idx')
    })

    this.schema.createTable(this.userPermissionsTableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE')
      table.enum('effect', ['allow', 'deny']).notNullable().defaultTo('allow')
      table.timestamp('starts_at').nullable()
      table.timestamp('ends_at').nullable()
      table.integer('granted_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('granted_at').defaultTo(this.now())
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.unique(['employee_id', 'permission_id'], { indexName: 'uk_user_permission' })
      table.index(['employee_id', 'effect'], 'user_permissions_employee_effect_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.userPermissionsTableName)

    this.schema.alterTable(this.permissionsTableName, (table) => {
      table.dropIndex(['module', 'action'], 'permissions_module_action_idx')
      table.dropColumn('resource')
      table.dropColumn('action')
      table.dropColumn('is_system')
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })

    this.schema.alterTable(this.rolesTableName, (table) => {
      table.dropIndex(['org_id', 'is_active'], 'roles_org_active_idx')
      table.dropForeign(['parent_role_id'], 'roles_parent_role_fk')
      table.dropColumn('description')
      table.dropColumn('parent_role_id')
      table.dropColumn('priority')
      table.dropColumn('is_active')
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })
  }
}
