import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addon_prices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.string('name', 100).notNullable().unique()
      table.string('slug', 100).notNullable().unique()
      table.decimal('price', 10, 2).notNullable().defaultTo(0.00)
      table.tinyint('plan_type').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_addon_price CHECK (price >= 0)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}