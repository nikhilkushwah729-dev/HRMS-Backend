import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leave_types'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('type_name', 100).notNullable()
      table.integer('days_allowed').notNullable().defaultTo(0)
      table.boolean('carry_forward').notNullable().defaultTo(false)
      table.integer('max_carry_days').notNullable().defaultTo(0)
      table.boolean('is_paid').notNullable().defaultTo(true)
      table.boolean('requires_doc').notNullable().defaultTo(false).comment('Medical cert required')

      table.unique(['org_id', 'type_name'], { indexName: 'uk_org_type' })
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_days CHECK (days_allowed >= 0)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}