import { test } from '@japa/runner'
import crypto from 'node:crypto'
import env from '#start/env'
import SubscriptionService from '#services/SubscriptionService'

test.group('Webhook Verification Spec (Priority 1)', () => {
  test('rejects Razorpay webhook when signature header is missing or invalid', async ({ assert }) => {
    const service = new SubscriptionService()

    // Test missing signature
    try {
      await service.handleGatewayWebhook('razorpay', {}, undefined, '{}')
      assert.fail('Expected exception for missing signature')
    } catch (error: any) {
      assert.equal(error.status, 400)
      assert.include(error.message, 'Missing x-razorpay-signature header')
    }

    // Test invalid signature
    try {
      await service.handleGatewayWebhook('razorpay', { test: 1 }, 'invalid_signature_hash', '{"test":1}')
      assert.fail('Expected exception for invalid signature')
    } catch (error: any) {
      assert.equal(error.status, 400)
      assert.include(error.message, 'Invalid Razorpay webhook signature')
    }
  })

  test('accepts valid Razorpay webhook signature', async ({ assert }) => {
    const secret = env.get('RAZORPAY_WEBHOOK_SECRET') || 'rzp_wh_secret_dev_3333_local'
    const service = new SubscriptionService()

    const rawBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'non_existent_ord' } } } })
    const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    // Should verify signature without throwing 400 invalid signature error
    await service.handleGatewayWebhook('razorpay', JSON.parse(rawBody), validSignature, rawBody)
    assert.isTrue(true)
  })

  test('rejects Stripe webhook when signature header is missing or invalid', async ({ assert }) => {
    const service = new SubscriptionService()

    // Test missing signature
    try {
      await service.handleGatewayWebhook('stripe', {}, undefined, '{}')
      assert.fail('Expected exception for missing signature')
    } catch (error: any) {
      assert.equal(error.status, 400)
      assert.include(error.message, 'Missing stripe-signature header')
    }

    // Test invalid signature
    const now = Math.floor(Date.now() / 1000)
    try {
      await service.handleGatewayWebhook('stripe', { type: 'checkout.session.completed' }, `t=${now},v1=invalid_hash`, '{"type":"checkout.session.completed"}')
      assert.fail('Expected exception for invalid signature')
    } catch (error: any) {
      assert.equal(error.status, 400)
      assert.include(error.message, 'Invalid Stripe webhook signature')
    }
  })

  test('accepts valid Stripe webhook signature', async ({ assert }) => {
    const secret = env.get('STRIPE_WEBHOOK_SECRET') || 'whsec_stripe_secret_dev_3333_local'
    const service = new SubscriptionService()

    const rawBody = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_test_123' } } })
    const now = Math.floor(Date.now() / 1000)
    const bodyToSign = `${now}.${rawBody}`
    const validSignature = crypto.createHmac('sha256', secret).update(bodyToSign).digest('hex')

    // Should verify signature successfully
    await service.handleGatewayWebhook('stripe', JSON.parse(rawBody), `t=${now},v1=${validSignature}`, rawBody)
    assert.isTrue(true)
  })
})
