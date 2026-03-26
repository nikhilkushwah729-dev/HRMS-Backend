import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'announcements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.text('content').nullable()
      table.enum('target', ['all', 'department', 'role']).notNullable().defaultTo('all')
      table.integer('target_id').unsigned().nullable()
      table.dateTime('published_at').nullable()
      table.dateTime('expires_at').nullable()
      table.integer('created_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}