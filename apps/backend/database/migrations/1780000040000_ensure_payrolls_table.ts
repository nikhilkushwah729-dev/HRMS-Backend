import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payrolls'

  async up() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (!hasTable) {
      this.schema.createTable(this.tableName, (table) => {
        table.increments('id').unsigned().primary()
        table.integer('employee_id').unsigned().notNullable()
        table.integer('org_id').unsigned().notNullable()
        table.tinyint('month').notNullable()
        table.smallint('year').notNullable()
        table.decimal('basic_salary', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('hra', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('allowances', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('bonus', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('gross_salary', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('pf_deduction', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('esi_deduction', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('tds_deduction', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('other_deductions', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('total_deductions', 12, 2).notNullable().defaultTo(0.00)
        table.decimal('net_salary', 12, 2).notNullable().defaultTo(0.00)
        table.date('payment_date').nullable()
        table.enum('payment_mode', ['bank_transfer', 'cash', 'cheque']).defaultTo('bank_transfer')
        table.string('payment_ref', 100).nullable()
        table.enum('status', ['draft', 'processed', 'paid', 'failed', 'reversed']).notNullable().defaultTo('draft')
        table.integer('processed_by').unsigned().nullable()
        table.boolean('is_locked').notNullable().defaultTo(false)
        table.timestamp('created_at').defaultTo(this.now())
        table.timestamp('updated_at').defaultTo(this.now())

        table.index(['org_id'], 'idx_payrolls_org_id')
        table.index(['employee_id'], 'idx_payrolls_employee_id')
        table.index(['month', 'year'], 'idx_payrolls_month_year')
      })
    }
  }

  async down() {
    // Preserve data on rollback
  }
}
