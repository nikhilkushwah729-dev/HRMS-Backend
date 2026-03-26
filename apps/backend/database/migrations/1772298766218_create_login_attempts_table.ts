import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'login_attempts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().primary()
      table.integer('employee_id').unsigned().nullable()
      table.integer('org_id').unsigned().nullable()
      table.string('email', 255).notNullable()
      table.string('ip_address', 45).notNullable()
      table.string('user_agent', 500).nullable()
      table.enum('attempt_type', ['password', 'otp', 'magic_link']).notNullable().defaultTo('password')
      table.enum('status', ['success', 'failed', 'blocked']).notNullable()
      table.string('failure_reason', 100).nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['email', 'ip_address'], 'idx_email_ip')
      table.index(['created_at'], 'idx_created')
      table.index(['ip_address'], 'idx_ip')
      table.index(['employee_id', 'created_at'], 'idx_emp_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}