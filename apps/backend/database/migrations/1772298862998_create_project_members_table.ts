import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'project_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.enum('role', ['lead', 'member', 'reviewer']).notNullable().defaultTo('member')
      table.integer('added_by').unsigned().nullable()
      table.timestamp('added_at').defaultTo(this.now())

      table.primary(['project_id', 'employee_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}