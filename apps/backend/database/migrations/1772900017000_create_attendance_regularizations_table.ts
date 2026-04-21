import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendance_regularizations'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('attendance_id').unsigned().nullable().references('id').inTable('attendances').onDelete('SET NULL')
      table.date('regularization_date').notNullable()
      table.time('check_in').nullable()
      table.time('check_out').nullable()
      table.enum('type', ['missed_punch', 'late_arrival', 'half_day', 'other']).notNullable()
      table.text('reason').notNullable()
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending')
      table.text('admin_notes').nullable()
      table.text('rejection_reason').nullable()
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['employee_id'], 'attendance_regularizations_employee_id_index')
      table.index(['org_id'], 'attendance_regularizations_org_id_index')
      table.index(['status'], 'attendance_regularizations_status_index')
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
