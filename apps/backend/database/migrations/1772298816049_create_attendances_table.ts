import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.date('attendance_date').notNullable()
      table.dateTime('check_in').nullable()
      table.dateTime('check_out').nullable()

      // Knex/Adonis doesn't support GENERATED ALWAYS AS STORED easily in migration builder
      // We will add it via raw SQL after table creation

      table.decimal('check_in_lat', 10, 8).nullable()
      table.decimal('check_in_lng', 11, 8).nullable()
      table.decimal('check_out_lat', 10, 8).nullable()
      table.decimal('check_out_lng', 11, 8).nullable()
      table.enum('status', ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend']).notNullable().defaultTo('present')
      table.enum('source', ['manual', 'biometric', 'mobile', 'web', 'geo_fence']).notNullable().defaultTo('web')
      table.string('notes', 500).nullable()
      table.integer('modified_by').unsigned().nullable()
      table.dateTime('modified_at').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.unique(['employee_id', 'attendance_date'], { indexName: 'uk_emp_date' })
      table.index(['attendance_date'], 'idx_date')
      table.index(['org_id'], 'idx_org_id')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD COLUMN work_hours DECIMAL(5,2) GENERATED ALWAYS AS (ROUND(TIMESTAMPDIFF(MINUTE, check_in, check_out) / 60, 2)) STORED`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_checkout_after_checkin CHECK (check_out IS NULL OR check_out > check_in)`)
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}