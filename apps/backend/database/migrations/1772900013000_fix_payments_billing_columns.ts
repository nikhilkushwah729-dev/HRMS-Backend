import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasPaymentGateway = await this.schema.hasColumn('payments', 'payment_gateway')
    const hasProvider = await this.schema.hasColumn('payments', 'provider')
    const hasProviderOrderId = await this.schema.hasColumn('payments', 'provider_order_id')
    const hasProviderPaymentId = await this.schema.hasColumn('payments', 'provider_payment_id')
    const hasProviderSignature = await this.schema.hasColumn('payments', 'provider_signature')
    const hasBillingCycle = await this.schema.hasColumn('payments', 'billing_cycle')
    const hasFailureReason = await this.schema.hasColumn('payments', 'failure_reason')
    const hasInvoiceUrl = await this.schema.hasColumn('payments', 'invoice_url')
    const hasWebhookEventId = await this.schema.hasColumn('payments', 'webhook_event_id')
    const hasMetadata = await this.schema.hasColumn('payments', 'metadata')

    if (
      !hasPaymentGateway ||
      !hasProvider ||
      !hasProviderOrderId ||
      !hasProviderPaymentId ||
      !hasProviderSignature ||
      !hasBillingCycle ||
      !hasFailureReason ||
      !hasInvoiceUrl ||
      !hasWebhookEventId ||
      !hasMetadata
    ) {
      this.schema.alterTable('payments', (table) => {
        if (!hasPaymentGateway) table.string('payment_gateway', 30).nullable().after('payment_method')
        if (!hasProvider) table.string('provider', 30).nullable()
        if (!hasProviderOrderId) table.string('provider_order_id', 255).nullable()
        if (!hasProviderPaymentId) table.string('provider_payment_id', 255).nullable()
        if (!hasProviderSignature) table.string('provider_signature', 500).nullable()
        if (!hasBillingCycle) table.string('billing_cycle', 20).nullable()
        if (!hasFailureReason) table.string('failure_reason', 500).nullable()
        if (!hasInvoiceUrl) table.string('invoice_url', 500).nullable()
        if (!hasWebhookEventId) table.string('webhook_event_id', 255).nullable()
        if (!hasMetadata) table.json('metadata').nullable()
      })
    }
  }

  async down() {}
}
