import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'social_logins'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable()
      table.string('provider', 50).notNullable().comment('google, github, etc.')
      table.string('provider_user_id', 255).notNullable()
      table.json('profile_data').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.unique(['provider', 'provider_user_id'], { indexName: 'uk_provider_user' })
      table.index(['employee_id'], 'idx_employee')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}