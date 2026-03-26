import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable()
      table.integer('org_id').unsigned().notNullable()
      table.string('title', 255).notNullable()
      table.text('message').notNullable()
      table.string('type', 50).nullable().comment('info, success, warning, error')
      table.string('link', 500).nullable()
      table.boolean('is_read').notNullable().defaultTo(false)
      table.dateTime('read_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['employee_id', 'is_read'], 'idx_emp_read')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}