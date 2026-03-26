import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'org_registrations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.string('org_name', 100).notNullable()
      table.string('admin_email', 255).notNullable()
      table.string('admin_phone', 20).nullable()
      table.string('verification_token', 255).notNullable().unique()
      table.enum('status', ['pending', 'verified', 'approved', 'rejected']).notNullable().defaultTo('pending')
      table.json('onboarding_data').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['admin_email'], 'idx_email')
      table.index(['verification_token'], 'idx_token')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}