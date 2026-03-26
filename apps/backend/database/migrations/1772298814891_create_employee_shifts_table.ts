import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employee_shifts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('shift_id').unsigned().notNullable().references('id').inTable('shifts').onDelete('CASCADE')
      table.date('effective_from').notNullable()
      table.date('effective_to').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}