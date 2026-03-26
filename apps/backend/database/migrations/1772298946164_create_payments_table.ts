import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('plan_id').unsigned().nullable().references('id').inTable('plans').onDelete('SET NULL')
      table.decimal('amount', 12, 2).notNullable()
      table.string('currency', 10).notNullable().defaultTo('INR')
      table.string('payment_method', 50).nullable()
      table.string('transaction_id', 255).nullable().unique().comment('Gateway transaction ID')
      table.json('gateway_response').nullable()
      table.string('idempotency_key', 100).nullable().unique().comment('Client-side key')
      table.enum('status', ['pending', 'success', 'failed', 'refunded', 'disputed']).notNullable().defaultTo('pending')
      table.dateTime('paid_at').nullable()
      table.dateTime('refunded_at').nullable()
      table.decimal('refund_amount', 12, 2).nullable()
      table.string('refund_ref', 255).nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['status'], 'idx_status')
      table.index(['org_id'], 'idx_org_id')
      table.index(['transaction_id'], 'idx_gateway_tx')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_payment_amount CHECK (amount > 0)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_refund_amount CHECK (refund_amount IS NULL OR (refund_amount > 0 AND refund_amount <= amount))`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}