import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (!hasTable) {
      this.schema.createTable(this.tableName, (table) => {
        table.bigIncrements('id').unsigned().primary()
        table.integer('org_id').unsigned().nullable().index('idx_audit_org_id')
        table.integer('user_id').unsigned().nullable().index('idx_audit_user_id')
        table.integer('employee_id').unsigned().nullable().index('idx_audit_employee_id')
        table.string('action', 50).notNullable().index('idx_audit_action')
        table.string('module', 50).notNullable().index('idx_audit_module')
        table.string('entity_type', 100).nullable()
        table.string('entity_name', 100).nullable()
        table.string('entity_id', 50).nullable()
        table.text('description').nullable()
        table.json('old_values').nullable()
        table.json('new_values').nullable()
        table.string('ip_address', 45).nullable()
        table.string('user_agent', 500).nullable()
        table.string('request_method', 10).nullable()
        table.string('request_url', 500).nullable()
        table.string('status', 20).notNullable().defaultTo('success').index('idx_audit_status')
        table.string('country_code', 5).nullable()
        table.string('country_name', 100).nullable()
        table.string('region_name', 100).nullable()
        table.string('city_name', 100).nullable()
        table.decimal('latitude', 10, 8).nullable()
        table.decimal('longitude', 11, 8).nullable()
        table.boolean('is_immutable').notNullable().defaultTo(true)
        table.timestamp('created_at').defaultTo(this.now()).index('idx_audit_created_at')

        table.index(['entity_type', 'entity_id'], 'idx_audit_entity_type_id')
      })
      return
    }

    const hasUserId = await this.schema.hasColumn(this.tableName, 'user_id')
    const hasEntityType = await this.schema.hasColumn(this.tableName, 'entity_type')
    const hasDescription = await this.schema.hasColumn(this.tableName, 'description')
    const hasRequestMethod = await this.schema.hasColumn(this.tableName, 'request_method')
    const hasRequestUrl = await this.schema.hasColumn(this.tableName, 'request_url')
    const hasStatus = await this.schema.hasColumn(this.tableName, 'status')

    this.schema.alterTable(this.tableName, (table) => {
      if (!hasUserId) {
        table.integer('user_id').unsigned().nullable().after('org_id')
      }
      if (!hasEntityType) {
        table.string('entity_type', 100).nullable().after('module')
      }
      if (!hasDescription) {
        table.text('description').nullable().after('entity_id')
      }
      if (!hasRequestMethod) {
        table.string('request_method', 10).nullable().after('user_agent')
      }
      if (!hasRequestUrl) {
        table.string('request_url', 500).nullable().after('request_method')
      }
      if (!hasStatus) {
        table.string('status', 20).notNullable().defaultTo('success').after('request_url')
      }
    })
  }

  async down() {
    const hasTable = await this.schema.hasTable(this.tableName)
    if (!hasTable) return

    const hasUserId = await this.schema.hasColumn(this.tableName, 'user_id')
    const hasEntityType = await this.schema.hasColumn(this.tableName, 'entity_type')
    const hasDescription = await this.schema.hasColumn(this.tableName, 'description')
    const hasRequestMethod = await this.schema.hasColumn(this.tableName, 'request_method')
    const hasRequestUrl = await this.schema.hasColumn(this.tableName, 'request_url')
    const hasStatus = await this.schema.hasColumn(this.tableName, 'status')

    this.schema.alterTable(this.tableName, (table) => {
      if (hasUserId) table.dropColumn('user_id')
      if (hasEntityType) table.dropColumn('entity_type')
      if (hasDescription) table.dropColumn('description')
      if (hasRequestMethod) table.dropColumn('request_method')
      if (hasRequestUrl) table.dropColumn('request_url')
      if (hasStatus) table.dropColumn('status')
    })
  }
}
