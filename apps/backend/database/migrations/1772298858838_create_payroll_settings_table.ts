import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payroll_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().unique().references('id').inTable('organizations').onDelete('CASCADE')
      table.decimal('pf_percent', 5, 2).notNullable().defaultTo(12.00)
      table.decimal('esi_percent', 5, 2).notNullable().defaultTo(0.75)
      table.decimal('tds_percent', 5, 2).notNullable().defaultTo(10.00)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_pf CHECK (pf_percent BETWEEN 0 AND 100)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_esi CHECK (esi_percent BETWEEN 0 AND 100)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_tds CHECK (tds_percent BETWEEN 0 AND 100)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}