import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('device_info', 500).nullable().after('check_out_lng')
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} MODIFY source ENUM('manual', 'biometric', 'mobile', 'web', 'geo_fence', 'camera', 'face') NOT NULL DEFAULT 'web'`)
  }

  async down() {
    this.schema.raw(`ALTER TABLE ${this.tableName} MODIFY source ENUM('manual', 'biometric', 'mobile', 'web', 'geo_fence') NOT NULL DEFAULT 'web'`)
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('device_info')
    })
  }
}
