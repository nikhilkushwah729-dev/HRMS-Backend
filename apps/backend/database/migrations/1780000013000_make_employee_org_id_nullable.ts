import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('employees', (table) => {
      table.integer('org_id').unsigned().nullable().alter()
    })
    this.schema.alterTable('user_sessions', (table) => {
      table.integer('org_id').unsigned().nullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable('employees', (table) => {
      table.integer('org_id').unsigned().notNullable().alter()
    })
    this.schema.alterTable('user_sessions', (table) => {
      table.integer('org_id').unsigned().notNullable().alter()
    })
  }
}
