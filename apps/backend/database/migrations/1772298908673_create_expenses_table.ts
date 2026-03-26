import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('project_id').unsigned().nullable().references('id').inTable('projects').onDelete('SET NULL')
      table.string('category', 100).nullable()
      table.decimal('amount', 12, 2).notNullable()
      table.date('expense_date').notNullable()
      table.text('description').nullable()
      table.string('receipt_url', 500).nullable()
      table.enum('status', ['pending', 'approved', 'rejected', 'reimbursed']).notNullable().defaultTo('pending')
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.dateTime('approved_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_expense_amount CHECK (amount > 0)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}