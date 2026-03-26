import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'module')
    if (hasColumn) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.string('module', 50).notNullable().defaultTo('').comment('employees, payroll, etc.').after('action')
    })
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'module')
    if (hasColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.dropColumn('module')
      })
    }
  }
}
