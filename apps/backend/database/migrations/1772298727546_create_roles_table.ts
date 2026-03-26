import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().nullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('role_name', 100).notNullable()
      table.boolean('is_system').notNullable().defaultTo(false)

      table.unique(['org_id', 'role_name'], { indexName: 'uk_org_role' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}