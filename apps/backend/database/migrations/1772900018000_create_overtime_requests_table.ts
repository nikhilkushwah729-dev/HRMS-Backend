import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'overtime_requests'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.date('date').notNullable()
      table.decimal('hours', 4, 2).notNullable()
      table.text('reason').notNullable()
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
      table.text('rejection_reason').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['employee_id'], 'overtime_requests_employee_id_index')
      table.index(['org_id'], 'overtime_requests_org_id_index')
      table.index(['status'], 'overtime_requests_status_index')
      table.index(['date'], 'overtime_requests_date_index')
    })
  }

  async down() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) {
      return
    }

    this.schema.dropTable(this.tableName)
  }
}
