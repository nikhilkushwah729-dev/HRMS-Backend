import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.string('permission_key', 100).notNullable().unique()
      table.string('description', 255).nullable()
      table.string('module', 50).nullable().comment('Group: employees, payroll, leave, etc.')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}