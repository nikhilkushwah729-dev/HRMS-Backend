import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'timesheets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('task_id').unsigned().nullable().references('id').inTable('tasks').onDelete('SET NULL')
      table.integer('project_id').unsigned().nullable().references('id').inTable('projects').onDelete('SET NULL')
      table.date('log_date').notNullable()
      table.decimal('hours_logged', 5, 2).notNullable()
      table.text('description').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['employee_id', 'log_date'], 'idx_employee_date')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_hours_logged CHECK (hours_logged > 0 AND hours_logged <= 24)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}