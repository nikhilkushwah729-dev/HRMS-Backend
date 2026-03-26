import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  async up() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'geofence_id')
    if (hasColumn) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.integer('geofence_id').unsigned().nullable().after('designation_id')
    })
  }

  async down() {
    const hasColumn = await this.schema.hasColumn(this.tableName, 'geofence_id')
    if (!hasColumn) {
      return
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('geofence_id')
    })
  }
}
