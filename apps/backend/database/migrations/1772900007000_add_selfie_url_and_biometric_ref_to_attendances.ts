import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendances'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('selfie_url', 2048).nullable().after('device_info')
      table.string('biometric_ref', 255).nullable().after('selfie_url')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('biometric_ref')
      table.dropColumn('selfie_url')
    })
  }
}
