import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasUpdatedAt = await this.schema.hasColumn('employee_invitations', 'updated_at')
    if (!hasUpdatedAt) {
      this.schema.alterTable('employee_invitations', (table) => {
        table.timestamp('updated_at').defaultTo(this.now())
      })
    }
  }

  async down() {
    const hasUpdatedAt = await this.schema.hasColumn('employee_invitations', 'updated_at')
    if (hasUpdatedAt) {
      this.schema.alterTable('employee_invitations', (table) => {
        table.dropColumn('updated_at')
      })
    }
  }
}
