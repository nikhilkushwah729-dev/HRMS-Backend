import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ess_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('approver_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.string('request_type', 50).notNullable()
      table.string('title', 180).notNullable()
      table.text('description').nullable()
      table.date('request_date').nullable()
      table.date('start_date').nullable()
      table.date('end_date').nullable()
      table.decimal('amount', 12, 2).nullable()
      table.string('status', 30).notNullable().defaultTo('pending')
      table.text('attachment_url').nullable()
      table.text('meta').nullable()
      table.text('resolution_note').nullable()
      table.timestamp('resolved_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['org_id', 'employee_id', 'status'], 'ess_requests_org_employee_status_idx')
      table.index(['org_id', 'request_type'], 'ess_requests_org_type_idx')
      table.index(['org_id', 'created_at'], 'ess_requests_org_created_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
