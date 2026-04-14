import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_late').notNullable().defaultTo(false)
      table.boolean('is_half_day').notNullable().defaultTo(false)
      table.boolean('is_overtime').notNullable().defaultTo(false)
      table.integer('total_break_min').notNullable().defaultTo(0)
      table.decimal('net_work_hours', 5, 2).notNullable().defaultTo(0)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('net_work_hours')
      table.dropColumn('total_break_min')
      table.dropColumn('is_overtime')
      table.dropColumn('is_half_day')
      table.dropColumn('is_late')
    })
  }
}
