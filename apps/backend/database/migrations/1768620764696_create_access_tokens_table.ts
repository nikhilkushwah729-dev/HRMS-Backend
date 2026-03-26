import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // This migration runs before `employees` exists in a fresh database,
      // so keep the column plain and let the auth layer enforce consistency.
      table.integer('tokenable_id').notNullable().unsigned()

      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
    })
  }

  async down() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      this.schema.dropTable(this.tableName)
    }
  }
}
