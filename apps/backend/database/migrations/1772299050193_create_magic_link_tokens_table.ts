import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'magic_link_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable()
      table.string('token', 255).notNullable().unique()
      table.dateTime('expires_at').notNullable()
      table.boolean('is_used').notNullable().defaultTo(false)
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['token'], 'idx_token')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}