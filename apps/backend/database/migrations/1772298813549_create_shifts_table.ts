import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'shifts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('shift_name', 100).notNullable()
      table.time('start_time').notNullable()
      table.time('end_time').notNullable()
      table.integer('grace_minutes').notNullable().defaultTo(15)
      table.boolean('is_active').notNullable().defaultTo(true)
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_grace CHECK (grace_minutes >= 0 AND grace_minutes <= 60)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}