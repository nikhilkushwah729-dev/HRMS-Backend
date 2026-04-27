import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendance_logs'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (exists) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.integer('kiosk_id').unsigned().nullable().references('id').inTable('kiosks').onDelete('SET NULL')
      table.date('attendance_date').notNullable()
      table.enum('type', ['check_in', 'check_out']).notNullable()
      table.enum('method', ['face', 'pin', 'qr']).notNullable()
      table.timestamp('timestamp').notNullable().defaultTo(this.now())
      table.integer('shift_id').unsigned().nullable().references('id').inTable('shifts').onDelete('SET NULL')
      table.enum('status', ['success', 'failed', 'suspicious']).notNullable().defaultTo('success')
      table.integer('late_minutes').notNullable().defaultTo(0)
      table.integer('early_exit_minutes').notNullable().defaultTo(0)
      table.integer('overtime_minutes').notNullable().defaultTo(0)
      table.string('ip_address', 191).nullable()
      table.string('device_id', 191).nullable()
      table.string('client_reference', 191).nullable()
      table.string('image_url', 1024).nullable()
      table.text('failure_reason').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.index(['org_id', 'attendance_date'], 'idx_attendance_logs_org_date')
      table.index(['employee_id', 'attendance_date'], 'idx_attendance_logs_emp_date')
      table.index(['kiosk_id', 'status'], 'idx_attendance_logs_kiosk_status')
      table.unique(['kiosk_id', 'client_reference'], { indexName: 'uq_attendance_logs_kiosk_client_ref' })
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
