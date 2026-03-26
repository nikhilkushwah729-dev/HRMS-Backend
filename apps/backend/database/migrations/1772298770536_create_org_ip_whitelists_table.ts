import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'org_ip_whitelists'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('ip_cidr', 50).notNullable()
      table.string('label', 100).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('created_by').unsigned().nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['org_id'], 'idx_org')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}