import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'organizations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.string('company_name', 255).notNullable()
      table.string('email', 255).notNullable().unique()
      table.string('phone', 20).nullable()
      table.text('address').nullable()
      table.string('city', 100).nullable()
      table.string('state', 100).nullable()
      table.string('country', 100).nullable()
      table.string('postal_code', 20).nullable()
      table.string('gstin', 20).nullable().comment('[S5] Encrypt at app layer (AES-256)')
      table.string('logo', 500).nullable()
      table.integer('plan_id').unsigned().nullable().references('id').inTable('plans').onDelete('SET NULL').onUpdate('CASCADE')
      table.boolean('plan_status').notNullable().defaultTo(false)
      table.date('plan_end_date').nullable()
      table.integer('user_limit').notNullable().defaultTo(10)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_verified').notNullable().defaultTo(false).comment('[S13] Email verified flag')
      table.string('verification_token', 100).nullable().comment('[S13] Email verification token')
      table.string('timezone', 50).notNullable().defaultTo('Asia/Kolkata')

      // [S1] Soft delete
      table.timestamp('deleted_at').nullable().defaultTo(null)
      table.integer('deleted_by').unsigned().nullable()

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['plan_status'], 'idx_plan_status')
      table.index(['plan_end_date'], 'idx_plan_end_date')
      table.index(['is_active'], 'idx_is_active')
      table.index(['deleted_at'], 'idx_deleted_at')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_org_email CHECK (email LIKE '%@%.%')`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}