import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employee_invitations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable()
      table.string('email', 255).notNullable()
      table.integer('role_id').unsigned().nullable()
      table.string('token', 255).notNullable().unique()
      table.enum('status', ['pending', 'accepted', 'expired', 'revoked']).notNullable().defaultTo('pending')
      table.dateTime('expires_at').notNullable()
      table.integer('invited_by').unsigned().nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['token'], 'idx_token')
      table.index(['email', 'org_id'], 'idx_email_org')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}