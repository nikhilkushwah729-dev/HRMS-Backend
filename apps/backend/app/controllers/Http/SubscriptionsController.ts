import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import SubscriptionService from '#services/SubscriptionService'
import LegacyBillingService from '#services/LegacyBillingService'

export default class SubscriptionsController {
  constructor(
    protected subscriptionService: SubscriptionService = new SubscriptionService(),
    protected legacyBillingService: LegacyBillingService = new LegacyBillingService()
  ) {}

  static upgradeValidator = vine.compile(
    vine.object({
      planId: vine.number(),
      billingCycle: vine.enum(['monthly', 'yearly']),
      gateway: vine.enum(['razorpay', 'stripe']),
    })
  )

  static verifyValidator = vine.compile(
    vine.object({
      paymentId: vine.number(),
      gateway: vine.enum(['razorpay', 'stripe']),
      providerPaymentId: vine.string().optional(),
      signature: vine.string().optional(),
      status: vine.enum(['success', 'failed']),
    })
  )

  static legacyPurchaseValidator = vine.compile(
    vine.object({
      nouser: vine.number(),
      selectedAddons: vine.array(
        vine.object({
          name: vine.string(),
          status: vine.boolean(),
        })
      ),
      paymentMethod: vine.string(),
      state: vine.string(),
      country: vine.string(),
      zip: vine.string().optional(),
      city: vine.string().optional(),
      name: vine.string(),
      duration: vine.number(),
      durationType: vine.string(),
      gstin: vine.string().optional(),
      remark: vine.string().optional(),
      action: vine.enum(['Buy', 'Upgrade']),
    })
  )

  static legacyConfirmValidator = vine.compile(
    vine.object({
      paymentRecordId: vine.number(),
      orderId: vine.string(),
      paymentStatus: vine.string(),
      paymentRzrId: vine.string(),
      nouser: vine.number(),
      duration: vine.number(),
      durationType: vine.string(),
      action: vine.enum(['Buy', 'Upgrade']),
    })
  )

  async listPlans({ response }: HttpContext) {
    const plans = await this.subscriptionService.listPlans()
    return response.ok({ status: 'success', data: plans })
  }

  async getStatus({ auth, response }: HttpContext) {
    const employee = auth.user!
    const status = await this.subscriptionService.getCurrentSubscription(employee.orgId)
    return response.ok({ status: 'success', data: status })
  }

  async createUpgradeIntent({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(SubscriptionsController.upgradeValidator)
    const intent = await this.subscriptionService.createUpgradeIntent(employee.orgId, data)
    return response.ok({ status: 'success', data: intent })
  }

  async verifyPayment({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(SubscriptionsController.verifyValidator)
    const payment = await this.subscriptionService.verifyPayment(employee.orgId, data)
    return response.ok({ status: 'success', data: payment })
  }

  async razorpayWebhook({ request, response }: HttpContext) {
    await this.subscriptionService.handleGatewayWebhook('razorpay', request.all(), request.header('x-razorpay-signature') || undefined)
    return response.ok({ status: 'success' })
  }

  async stripeWebhook({ request, response }: HttpContext) {
    await this.subscriptionService.handleGatewayWebhook('stripe', request.all(), request.header('stripe-signature') || undefined)
    return response.ok({ status: 'success' })
  }

  async getLegacyContext({ auth, response }: HttpContext) {
    const employee = auth.user!
    const data = await this.legacyBillingService.getContext(employee.orgId)
    return response.ok({ status: 'success', data })
  }

  async legacyPurchase({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(SubscriptionsController.legacyPurchaseValidator)
    const purchase = await this.legacyBillingService.initiatePurchase(employee.orgId, data)
    return response.ok({ status: 'success', data: purchase })
  }

  async legacyConfirm({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(SubscriptionsController.legacyConfirmValidator)
    const result = await this.legacyBillingService.confirmPurchase(employee.orgId, data)
    return response.ok({ status: 'success', data: result })
  }

  async legacyInvoice({ request, response }: HttpContext) {
    const paymentRef = request.input('paymentRef')
    const invoice = await this.legacyBillingService.getInvoice(String(paymentRef || ''))
    return response.ok({ status: 'success', data: invoice })
  }
}
