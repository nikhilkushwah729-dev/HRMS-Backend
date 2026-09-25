import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'leaves'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('duration_type', ['full_day', 'half_day'])
        .notNullable()
        .defaultTo('full_day')
        .after('end_date')

      table
        .enum('half_day_session', ['first_half', 'second_half'])
        .nullable()
        .after('duration_type')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('duration_type')
      table.dropColumn('half_day_session')
    })
  }
}
