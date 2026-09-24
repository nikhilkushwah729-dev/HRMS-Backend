import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('break_start').nullable().after('net_work_hours')
      table.dateTime('break_end').nullable().after('break_start')
      table.integer('break_duration').nullable().after('break_end')
    })

    if (!this.db.dialect.name.includes('sqlite') && process.env.DB_CONNECTION !== 'sqlite') {
      this.schema.raw(
        `ALTER TABLE ${this.tableName} MODIFY source ENUM('manual', 'biometric', 'mobile', 'web', 'geo_fence', 'camera', 'face', 'kiosk') NOT NULL DEFAULT 'web'`
      )
    }
  }

  async down() {
    if (!this.db.dialect.name.includes('sqlite') && process.env.DB_CONNECTION !== 'sqlite') {
      this.schema.raw(
        `ALTER TABLE ${this.tableName} MODIFY source ENUM('manual', 'biometric', 'mobile', 'web', 'geo_fence', 'camera', 'face') NOT NULL DEFAULT 'web'`
      )
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('break_start')
      table.dropColumn('break_end')
      table.dropColumn('break_duration')
    })
  }
}
