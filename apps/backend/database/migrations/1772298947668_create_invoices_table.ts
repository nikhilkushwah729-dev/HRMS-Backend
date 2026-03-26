import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('payment_id').unsigned().notNullable().references('id').inTable('payments').onDelete('RESTRICT')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('RESTRICT')
      table.string('invoice_number', 50).notNullable().unique()
      table.decimal('subtotal', 12, 2).notNullable().defaultTo(0.00)
      table.decimal('tax_percent', 5, 2).notNullable().defaultTo(18.00)

      // tax_amount = ROUND(subtotal * tax_percent / 100, 2)
      // total = subtotal + tax_amount

      table.text('notes').nullable()
      table.boolean('is_void').notNullable().defaultTo(false)
      table.string('void_reason', 255).nullable()
      table.timestamp('created_at').defaultTo(this.now())
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (ROUND(subtotal * tax_percent / 100, 2)) STORED`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN total DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + ROUND(subtotal * tax_percent / 100, 2)) STORED`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_invoice_subtotal CHECK (subtotal >= 0)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_invoice_tax CHECK (tax_percent BETWEEN 0 AND 100)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}