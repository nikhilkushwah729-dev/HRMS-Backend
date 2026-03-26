import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'trusted_devices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable()
      table.string('device_id', 255).notNullable()
      table.string('device_name', 255).nullable()
      table.timestamp('trusted_at').defaultTo(this.now())
      table.dateTime('last_used_at').nullable()

      table.unique(['employee_id', 'device_id'], { indexName: 'uk_emp_device' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}