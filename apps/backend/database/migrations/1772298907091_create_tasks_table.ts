import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('project_id').unsigned().notNullable().references('id').inTable('projects').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('parent_id').unsigned().nullable().references('id').inTable('tasks').onDelete('CASCADE')
      table.integer('assigned_to').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.integer('created_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.string('title', 255).notNullable()
      table.text('description').nullable()
      table.enum('priority', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium')
      table.enum('status', ['pending', 'in_progress', 'review', 'completed', 'cancelled']).notNullable().defaultTo('pending')
      table.date('due_date').nullable()
      table.decimal('estimated_hours', 6, 2).nullable()
      table.decimal('actual_hours', 6, 2).nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['status'], 'idx_status')
      table.index(['assigned_to'], 'idx_assigned_to')
      table.index(['deleted_at'], 'idx_deleted_at')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_task_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}