import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'designations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL')
      table.string('designation_name', 100).notNullable()

      table.unique(['org_id', 'designation_name'], { indexName: 'uk_org_desig' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}