import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    const hasOrganizationsTrialStart = await this.schema.hasColumn('organizations', 'trial_start_date')
    if (!hasOrganizationsTrialStart) {
      this.schema.alterTable('organizations', (table) => {
        table.date('trial_start_date').nullable()
        table.date('trial_end_date').nullable()
        table.boolean('is_trial_active').notNullable().defaultTo(false)
        table.string('subscription_status', 30).notNullable().defaultTo('inactive')
        table.date('grace_period_end_date').nullable()
        table.boolean('read_only_mode').notNullable().defaultTo(false)
        table.dateTime('subscription_last_notified_at').nullable()
        table.index(['subscription_status'], 'idx_org_subscription_status')
        table.index(['trial_end_date'], 'idx_org_trial_end_date')
      })
    }
    const hasPlansSlug = await this.schema.hasColumn('plans', 'slug')
    if (!hasPlansSlug) {
      this.schema.alterTable('plans', (table) => {
        table.string('slug', 80).nullable().unique()
        table.decimal('monthly_price', 10, 2).notNullable().defaultTo(0.0)
        table.decimal('yearly_price', 10, 2).notNullable().defaultTo(0.0)
        table.string('currency', 10).notNullable().defaultTo('INR')
        table.integer('storage_limit_mb').notNullable().defaultTo(512)
        table.integer('sort_order').notNullable().defaultTo(0)
        table.boolean('is_public').notNullable().defaultTo(true)
        table.boolean('is_trial_plan').notNullable().defaultTo(false)
        table.json('modules').nullable()
      })
    }
    const hasPaymentsProvider = await this.schema.hasColumn('payments', 'provider')
    const hasPaymentsGateway = await this.schema.hasColumn('payments', 'payment_gateway')
    if (!hasPaymentsProvider || !hasPaymentsGateway) {
      this.schema.alterTable('payments', (table) => {
        if (!hasPaymentsProvider) {
          table.string('provider', 30).nullable()
          table.string('provider_order_id', 255).nullable()
          table.string('provider_payment_id', 255).nullable()
          table.string('provider_signature', 500).nullable()
          table.string('billing_cycle', 20).nullable()
          table.string('failure_reason', 500).nullable()
          table.string('invoice_url', 500).nullable()
          table.string('webhook_event_id', 255).nullable()
          table.json('metadata').nullable()
          table.index(['provider', 'provider_order_id'], 'idx_payments_provider_order')
        }
        if (!hasPaymentsGateway) {
          table.string('payment_gateway', 30).nullable().after('payment_method')
        }
      })
    }
    const hasSubscriptions = await this.schema.hasTable('subscriptions')
    if (!hasSubscriptions) {
      this.schema.createTable('subscriptions', (table) => {
        table.increments('id').unsigned().primary()
        table.integer('org_id').unsigned().notNullable().references('id').inTable('organizations').onDelete('CASCADE')
        table.integer('plan_id').unsigned().nullable().references('id').inTable('plans').onDelete('SET NULL')
        table.string('status', 30).notNullable().defaultTo('trialing')
        table.string('billing_cycle', 20).notNullable().defaultTo('trial')
        table.date('start_date').notNullable()
        table.date('end_date').nullable()
        table.date('trial_start_date').nullable()
        table.date('trial_end_date').nullable()
        table.date('grace_end_date').nullable()
        table.boolean('auto_renew').notNullable().defaultTo(false)
        table.string('payment_gateway', 30).nullable()
        table.string('external_subscription_id', 255).nullable()
        table.json('metadata').nullable()
        table.timestamp('created_at').defaultTo(this.now())
        table.timestamp('updated_at').defaultTo(this.now())
        table.index(['org_id', 'status'], 'idx_subscriptions_org_status')
        table.index(['end_date'], 'idx_subscriptions_end_date')
      })
    }
    const hasFeatureLimits = await this.schema.hasTable('feature_limits')
    if (!hasFeatureLimits) {
      this.schema.createTable('feature_limits', (table) => {
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
  }
  async down() {
    if (await this.schema.hasTable('feature_limits')) {
      this.schema.dropTable('feature_limits')
    }
    if (await this.schema.hasTable('subscriptions')) {
      this.schema.dropTable('subscriptions')
    }
  }
}
