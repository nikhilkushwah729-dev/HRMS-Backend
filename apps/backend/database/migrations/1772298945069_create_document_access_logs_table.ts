import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_access_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().primary()
      table.integer('document_id').unsigned().notNullable().references('id').inTable('documents').onDelete('RESTRICT')
      table.integer('employee_id').unsigned().notNullable()
      table.integer('org_id').unsigned().notNullable()
      table.enum('action', ['view', 'download', 'print', 'share']).notNullable()
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 500).nullable()
      table.timestamp('accessed_at').defaultTo(this.now())

      table.index(['document_id'], 'idx_document')
      table.index(['employee_id'], 'idx_employee')
      table.index(['accessed_at'], 'idx_accessed')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}