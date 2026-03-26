import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('CASCADE')
      table.string('title', 255).notNullable()
      table.string('file_uuid', 36).notNullable().unique().comment('UUID maps to secure storage')
      table.string('file_type', 50).nullable()
      table.integer('file_size_kb').unsigned().nullable()
      table.string('mime_type', 100).nullable()
      table.string('category', 100).nullable()
      table.boolean('is_private').notNullable().defaultTo(false)
      table.boolean('is_encrypted').notNullable().defaultTo(false)
      table.string('checksum', 64).nullable().comment('SHA-256 hash')
      table.integer('uploaded_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['file_uuid'], 'idx_file_uuid')
      table.index(['deleted_at'], 'idx_deleted_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}