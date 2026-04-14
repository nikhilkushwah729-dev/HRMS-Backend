import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'face_embeddings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table
        .integer('employee_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('employees')
        .onDelete('CASCADE')
      table
        .integer('org_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('organizations')
        .onDelete('CASCADE')
      table.text('embedding', 'longtext').notNullable()
      table.string('image_url', 500).nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['employee_id'], 'idx_face_embeddings_employee_id')
      table.index(['org_id'], 'idx_face_embeddings_org_id')
      table.index(['is_active'], 'idx_face_embeddings_active')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
