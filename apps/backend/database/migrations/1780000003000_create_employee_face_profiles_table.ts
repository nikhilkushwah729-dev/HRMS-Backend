import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employee_face_profiles'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.text('face_embedding', 'longtext').notNullable()
      table.string('reference_image_url', 1024).nullable()
      table.enum('status', ['active', 'inactive', 'pending', 'rejected']).notNullable().defaultTo('pending')
      table.integer('created_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['org_id', 'employee_id'], 'idx_face_profiles_org_employee')
      table.index(['org_id', 'status'], 'idx_face_profiles_org_status')
    })
  }

  async down() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) {
      return
    }

    this.schema.dropTable(this.tableName)
  }
}

