import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leaves'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('leave_type_id').unsigned().nullable().references('id').inTable('leave_types').onDelete('SET NULL')
      table.date('start_date').notNullable()
      table.date('end_date').notNullable()

      // total_days GENERATED ALWAYS AS (DATEDIFF(end_date, start_date) + 1) STORED

      table.text('reason').nullable()
      table.string('supporting_doc', 500).nullable().comment('Document path')
      table.enum('status', ['pending', 'approved', 'rejected', 'cancelled']).notNullable().defaultTo('pending')
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.dateTime('approved_at').nullable()
      table.text('rejection_note').nullable()
      table.integer('cancelled_by').unsigned().nullable()
      table.dateTime('cancelled_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['status'], 'idx_status')
      table.index(['org_id'], 'idx_org_id')
      table.index(['employee_id', 'start_date'], 'idx_employee_date')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN total_days DECIMAL(4,1) GENERATED ALWAYS AS (DATEDIFF(end_date, start_date) + 1) STORED`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}