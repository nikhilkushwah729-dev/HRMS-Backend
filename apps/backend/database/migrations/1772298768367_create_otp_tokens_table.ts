import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'otp_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().nullable()
      table.integer('org_id').unsigned().nullable()
      table.string('email', 255).notNullable()
      table.string('otp_hash', 255).notNullable().comment('bcrypt hash of OTP')
      table.enum('purpose', ['login_2fa', 'password_reset', 'email_verify', 'phone_verify', 'withdrawal']).notNullable()
      table.enum('channel', ['email', 'sms', 'authenticator']).notNullable().defaultTo('email')
      table.tinyint('attempts').notNullable().defaultTo(0)
      table.tinyint('max_attempts').notNullable().defaultTo(3)
      table.boolean('is_used').notNullable().defaultTo(false)
      table.dateTime('expires_at').notNullable()
      table.dateTime('used_at').nullable()
      table.string('ip_address', 45).nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['email', 'purpose'], 'idx_email_purpose')
      table.index(['expires_at'], 'idx_expires')
      table.index(['employee_id'], 'idx_employee')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}