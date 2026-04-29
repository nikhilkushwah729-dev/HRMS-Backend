import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected timesheetsTable = 'timesheets'
  protected logsTable = 'timesheet_approval_logs'

  async up() {
    this.schema.alterTable(this.timesheetsTable, (table) => {
      table.enum('entry_mode', ['daily', 'weekly']).notNullable().defaultTo('daily').after('project_id')
      table.string('client_name', 255).nullable().after('entry_mode')
      table.time('start_time').nullable().after('log_date')
      table.time('end_time').nullable().after('start_time')
      table.boolean('is_billable').notNullable().defaultTo(false).after('hours_logged')
      table.enum('status', ['draft', 'pending', 'approved', 'rejected', 'sent_back', 'locked']).notNullable().defaultTo('draft').after('is_billable')
      table.date('week_start').nullable().after('status')
      table.timestamp('submitted_at').nullable().after('week_start')
      table.timestamp('reviewed_at').nullable().after('submitted_at')
      table.integer('approved_by').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL').after('reviewed_at')
      table.text('review_note').nullable().after('approved_by')
      table.timestamp('locked_at').nullable().after('review_note')
      table.timestamp('updated_at').nullable().defaultTo(this.now()).after('created_at')
    })

    this.schema.createTable(this.logsTable, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('timesheet_id').unsigned().notNullable().references('id').inTable(this.timesheetsTable).onDelete('CASCADE')
      table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
      table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE')
      table.integer('actor_employee_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL')
      table.string('action', 50).notNullable()
      table.text('note').nullable()
      table.timestamp('created_at').defaultTo(this.now())

      table.index(['timesheet_id', 'created_at'], 'idx_timesheet_logs_lookup')
    })
  }

  async down() {
    this.schema.dropTable(this.logsTable)

    this.schema.alterTable(this.timesheetsTable, (table) => {
      table.dropColumn('entry_mode')
      table.dropColumn('client_name')
      table.dropColumn('start_time')
      table.dropColumn('end_time')
      table.dropColumn('is_billable')
      table.dropColumn('status')
      table.dropColumn('week_start')
      table.dropColumn('submitted_at')
      table.dropColumn('reviewed_at')
      table.dropColumn('approved_by')
      table.dropColumn('review_note')
      table.dropColumn('locked_at')
      table.dropColumn('updated_at')
    })
  }
}
