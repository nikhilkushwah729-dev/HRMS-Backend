import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payrolls'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.tinyint('month').notNullable()
      table.smallint('year').notNullable()
      table.decimal('basic_salary', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('hra', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('allowances', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('bonus', 12, 2).notNullable().defaultTo(0.00)

      // gross_salary = basic_salary + hra + allowances + bonus

      table.decimal('pf_deduction', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('esi_deduction', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('tds_deduction', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('other_deductions', 12, 2).notNullable().defaultTo(0.00)

      // total_deductions = pf_deduction + esi_deduction + tds_deduction + other_deductions
      // net_salary = basic_salary + hra + allowances + bonus - pf_deduction - esi_deduction - tds_deduction - other_deductions

      table.date('payment_date').nullable()
      table.enum('payment_mode', ['bank_transfer', 'cash', 'cheque']).defaultTo('bank_transfer')
      table.string('payment_ref', 100).nullable().comment('Bank UTR / cheque number')
      table.enum('status', ['draft', 'processed', 'paid', 'failed', 'reversed']).notNullable().defaultTo('draft')
      table.integer('processed_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.boolean('is_locked').notNullable().defaultTo(false).comment('Locked after payment')
      table.timestamp('created_at').defaultTo(this.now())

      table.unique(['employee_id', 'month', 'year'], { indexName: 'uk_emp_month' })
      table.index(['month', 'year'], 'idx_month_year')
      table.index(['org_id'], 'idx_org_id')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN gross_salary DECIMAL(12,2) GENERATED ALWAYS AS (basic_salary + hra + allowances + bonus) STORED`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN total_deductions DECIMAL(12,2) GENERATED ALWAYS AS (pf_deduction + esi_deduction + tds_deduction + other_deductions) STORED`)
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD COLUMN net_salary DECIMAL(12,2) GENERATED ALWAYS AS (basic_salary + hra + allowances + bonus - pf_deduction - esi_deduction - tds_deduction - other_deductions) STORED`
    )
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_payroll_month CHECK (month BETWEEN 1 AND 12)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_payroll_year CHECK (year BETWEEN 2000 AND 2100)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_salary_positive CHECK (basic_salary >= 0)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}