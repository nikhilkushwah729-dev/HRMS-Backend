import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('file_name', 255).nullable().after('title')
      table.text('file_path').nullable().after('file_name')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('file_path')
      table.dropColumn('file_name')
    })
  }
}
