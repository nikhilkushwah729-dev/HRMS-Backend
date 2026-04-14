import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasUpdatedAt = await this.schema.hasColumn('organization_addons', 'updated_at')
    if (!hasUpdatedAt) {
      this.schema.alterTable('organization_addons', (table) => {
        table.timestamp('updated_at').defaultTo(this.now())
      })
    }
  }

  async down() {}
}
