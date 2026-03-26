import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE')
      table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE')
      table.integer('granted_by').unsigned().nullable()
      table.timestamp('granted_at').defaultTo(this.now())

      table.primary(['role_id', 'permission_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}