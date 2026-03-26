import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.string('client_name', 255).nullable()
      table.date('start_date').nullable()
      table.date('end_date').nullable()
      table.decimal('budget', 14, 2).nullable()
      table.enum('status', ['not_started', 'ongoing', 'on_hold', 'completed', 'cancelled']).notNullable().defaultTo('not_started')
      table.enum('priority', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium')
      table.integer('created_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['status'], 'idx_status')
      table.index(['deleted_at'], 'idx_deleted_at')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_project_budget CHECK (budget IS NULL OR budget >= 0)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}