import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'password_histories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.string('password_hash', 255).notNullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['employee_id'], 'idx_employee')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}