import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'data_erasure_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable()
      table.integer('org_id').unsigned().notNullable()
      table.string('email', 255).notNullable()
      table.text('reason').nullable()
      table.enum('status', ['pending', 'processing', 'completed', 'rejected']).notNullable().defaultTo('pending')
      table.dateTime('requested_at').notNullable()
      table.dateTime('completed_at').nullable()
      table.integer('processed_by').unsigned().nullable()
      table.text('admin_note').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}