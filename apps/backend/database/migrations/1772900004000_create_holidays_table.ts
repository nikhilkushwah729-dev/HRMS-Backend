import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'holidays'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('name', 150).notNullable()
      table.date('holiday_date').notNullable()
      table.enum('type', ['national', 'company', 'optional']).notNullable().defaultTo('national')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.dateTime('created_at').notNullable().defaultTo(this.now())

      table.unique(['org_id', 'holiday_date'], { indexName: 'uk_holiday_org_date' })
      table.index(['org_id'], 'idx_holidays_org_id')
      table.index(['holiday_date'], 'idx_holidays_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
