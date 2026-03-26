import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL')
      table.integer('designation_id').unsigned().nullable().references('id').inTable('designations').onDelete('SET NULL')
      table.integer('role_id').unsigned().nullable().references('id').inTable('roles').onDelete('SET NULL')
      table.string('employee_code', 50).nullable()
      table.string('first_name', 100).notNullable()
      table.string('last_name', 100).nullable()
      table.string('email', 255).nullable().unique()
      table.string('phone', 20).nullable()

      table.string('password_hash', 255).nullable().comment('bcrypt/argon2id hash only')
      table.boolean('must_change_password').notNullable().defaultTo(true)
      table.boolean('is_locked').notNullable().defaultTo(false)
      table.dateTime('locked_until').nullable()

      table.string('avatar', 500).nullable()
      table.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']).nullable()
      table.date('date_of_birth').nullable()
      table.text('address').nullable().comment('ENCRYPT: AES-256 at app layer')
      table.string('emergency_contact', 100).nullable()
      table.string('emergency_phone', 20).nullable()

      table.decimal('salary', 12, 2).notNullable().defaultTo(0.00).comment('ENCRYPT: AES-256 at app layer')
      table.string('bank_account', 100).nullable().comment('ENCRYPT: AES-256 at app layer')
      table.string('bank_name', 100).nullable()
      table.string('ifsc_code', 20).nullable()
      table.string('pan_number', 20).nullable().comment('ENCRYPT: AES-256 at app layer - PII')
      table.string('aadhar_last4', 4).nullable().comment('Store only last 4 digits')

      table.date('join_date').nullable()
      table.date('exit_date').nullable()
      table.string('exit_reason', 255).nullable()
      table.enum('status', ['active', 'inactive', 'on_leave', 'terminated']).notNullable().defaultTo('active')
      table.boolean('email_verified').notNullable().defaultTo(false)

      // [S1] Soft delete
      table.timestamp('deleted_at').nullable()
      table.integer('deleted_by').unsigned().nullable()

      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      table.unique(['org_id', 'employee_code'], { indexName: 'uk_org_emp_code' })
      table.index(['status'], 'idx_status')
      table.index(['org_id'], 'idx_org_id')
      table.index(['deleted_at'], 'idx_deleted_at')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_emp_salary CHECK (salary >= 0)`)
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_emp_aadhar CHECK (aadhar_last4 REGEXP '^[0-9]{4}$' OR aadhar_last4 IS NULL)`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}