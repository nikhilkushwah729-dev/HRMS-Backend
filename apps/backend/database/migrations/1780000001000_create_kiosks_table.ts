import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kiosks'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('org_location_id').unsigned().nullable().references('id').inTable('org_locations').onDelete('SET NULL')
      table.string('name', 150).notNullable()
      table.string('location', 255).notNullable()
      table.string('device_id', 191).notNullable().unique()
      table.string('device_token', 191).nullable().unique()
      table.enum('status', ['pending', 'active', 'inactive', 'blocked']).notNullable().defaultTo('pending')
      table.timestamp('last_seen_at').nullable()
      table.integer('registered_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['org_id'], 'idx_kiosks_org_id')
      table.index(['org_id', 'status'], 'idx_kiosks_org_status')
      table.index(['org_location_id'], 'idx_kiosks_org_location_id')
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
