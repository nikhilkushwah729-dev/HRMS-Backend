import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'organization_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('setting_key', 150).notNullable()
      table.text('setting_value', 'longtext').notNullable()
      table.dateTime('created_at').notNullable().defaultTo(this.now())
      table.dateTime('updated_at').notNullable().defaultTo(this.now())

      table.unique(['org_id', 'setting_key'], { indexName: 'uk_org_setting_key' })
      table.index(['org_id'], 'idx_org_settings_org_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
