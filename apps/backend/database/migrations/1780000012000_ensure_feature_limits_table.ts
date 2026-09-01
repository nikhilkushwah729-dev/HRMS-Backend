import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Repairs databases where the original subscription migration was marked as
 * complete before the feature_limits table was created.
 */
export default class extends BaseSchema {
  protected tableName = 'feature_limits'

  async up() {
    if (await this.schema.hasTable(this.tableName)) {
      return
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.integer('plan_id').unsigned().notNullable().references('id').inTable('plans').onDelete('CASCADE')
      table.string('feature_key', 120).notNullable()
      table.string('feature_label', 150).nullable()
      table.string('feature_type', 20).notNullable().defaultTo('boolean')
      table.boolean('is_enabled').notNullable().defaultTo(false)
      table.string('limit_value', 255).nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())
      table.unique(['plan_id', 'feature_key'], { indexName: 'uk_feature_limit_plan_key' })
      table.index(['feature_key'], 'idx_feature_limits_key')
    })
  }

  async down() {
    // Intentionally left as a no-op: this migration may repair an existing production schema.
  }
}
