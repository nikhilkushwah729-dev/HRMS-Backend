import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'organization_addons'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('addon_id').unsigned().notNullable().references('id').inTable('addon_prices').onDelete('CASCADE')
      table.date('start_date').notNullable()
      table.date('end_date').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.unique(['org_id', 'addon_id'], { indexName: 'uk_org_addon' })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
