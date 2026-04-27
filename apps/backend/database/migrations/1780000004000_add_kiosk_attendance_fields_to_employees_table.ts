import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    const hasPinHash = await this.schema.hasColumn(this.tableName, 'kiosk_pin_hash')
    const hasAttempts = await this.schema.hasColumn(this.tableName, 'kiosk_pin_attempts')
    const hasBlockedUntil = await this.schema.hasColumn(this.tableName, 'kiosk_pin_blocked_until')

    this.schema.alterTable(this.tableName, (table) => {
      if (!hasPinHash) {
        table.string('kiosk_pin_hash', 255).nullable().after('password_hash')
      }
      if (!hasAttempts) {
        table.integer('kiosk_pin_attempts').notNullable().defaultTo(0).after('kiosk_pin_hash')
      }
      if (!hasBlockedUntil) {
        table.timestamp('kiosk_pin_blocked_until').nullable().after('kiosk_pin_attempts')
      }
    })
  }

  async down() {
    const hasPinHash = await this.schema.hasColumn(this.tableName, 'kiosk_pin_hash')
    const hasAttempts = await this.schema.hasColumn(this.tableName, 'kiosk_pin_attempts')
    const hasBlockedUntil = await this.schema.hasColumn(this.tableName, 'kiosk_pin_blocked_until')

    this.schema.alterTable(this.tableName, (table) => {
      if (hasBlockedUntil) {
        table.dropColumn('kiosk_pin_blocked_until')
      }
      if (hasAttempts) {
        table.dropColumn('kiosk_pin_attempts')
      }
      if (hasPinHash) {
        table.dropColumn('kiosk_pin_hash')
      }
    })
  }
}
