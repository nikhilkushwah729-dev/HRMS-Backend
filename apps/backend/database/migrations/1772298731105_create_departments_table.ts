import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'departments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('parent_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL')
      table.string('department_name', 100).notNullable()
      table.text('description').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)

      // [S1] Soft delete
      table.timestamp('deleted_at').nullable()

      table.unique(['org_id', 'department_name'], { indexName: 'uk_org_dept' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}