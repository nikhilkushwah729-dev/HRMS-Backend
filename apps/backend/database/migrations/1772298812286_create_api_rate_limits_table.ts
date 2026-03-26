import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_rate_limits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id').unsigned().primary()
      table.string('identifier', 255).notNullable().comment('IP or employee_id:org_id')
      table.string('endpoint', 255).notNullable()
      table.integer('request_count').unsigned().notNullable().defaultTo(1)
      table.dateTime('window_start').notNullable()
      table.dateTime('window_end').notNullable()
      table.boolean('is_blocked').notNullable().defaultTo(false)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.unique(['identifier', 'endpoint', 'window_start'], { indexName: 'uk_id_ep_ws' })
      table.index(['identifier'], 'idx_identifier')
      table.index(['window_end'], 'idx_window_end')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}