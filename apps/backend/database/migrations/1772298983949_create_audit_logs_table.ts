import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().primary()
      table.integer('org_id').unsigned().nullable()
      table.integer('employee_id').unsigned().nullable()
      table.string('action', 50).notNullable().comment('CREATE, UPDATE, DELETE, LOGIN, etc.')
      table.string('module', 50).notNullable().comment('employees, payroll, etc.')
      table.string('entity_name', 50).nullable().comment('Table name')
      table.string('entity_id', 50).nullable().comment('Primary key of entity')
      table.json('old_values').nullable()
      table.json('new_values').nullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 500).nullable()
      table.boolean('is_immutable').notNullable().defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['org_id', 'created_at'], 'idx_org_date')
      table.index(['employee_id', 'created_at'], 'idx_emp_date')
      table.index(['module', 'action'], 'idx_mod_act')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}