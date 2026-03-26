import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('country_code', 5).nullable().after('ip_address')
      table.string('country_name', 100).nullable().after('country_code')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('country_code')
      table.dropColumn('country_name')
    })
  }
}
