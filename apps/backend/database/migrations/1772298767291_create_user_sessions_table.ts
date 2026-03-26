import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable()
      table.string('session_token', 255).notNullable().unique()
      table.string('refresh_token', 255).nullable().unique()
      table.string('device_info', 500).nullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 500).nullable()
      table.timestamp('last_activity').defaultTo(this.now())
      table.dateTime('expires_at').notNullable()
      table.boolean('is_revoked').notNullable().defaultTo(false)
      table.dateTime('revoked_at').nullable()
      table.enum('revoked_reason', ['logout', 'password_change', 'admin_action', 'expired', 'security']).nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['session_token'], 'idx_token')
      table.index(['employee_id'], 'idx_employee')
      table.index(['expires_at'], 'idx_expires')
      table.index(['is_revoked'], 'idx_revoked')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}