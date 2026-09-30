import { test } from '@japa/runner'
import crypto from 'node:crypto'
import SubscriptionService from '#services/SubscriptionService'

test.group('Webhook Verification Spec (Priority 1)', () => {
  test('rejects Razorpay webhook when RAZORPAY_WEBHOOK_SECRET is not configured', async ({ assert }) => {
    const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    delete process.env.RAZORPAY_WEBHOOK_SECRET
    try {
      const service = new SubscriptionService()
      await service.handleGatewayWebhook('razorpay', {}, 'some-sig', '{}')
      assert.fail('Expected exception for missing secret')
    } catch (error: any) {
      assert.equal(error.status, 500)
      assert.include(error.message, 'RAZORPAY_WEBHOOK_SECRET')
    } finally {
      if (originalSecret) process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret
    }
  })

  test('rejects Razorpay webhook when signature header is missing or invalid', async ({ assert }) => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_razorpay_secret_123'
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
    const secret = 'test_razorpay_secret_123'
    process.env.RAZORPAY_WEBHOOK_SECRET = secret
    const service = new SubscriptionService()

    const rawBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { order_id: 'non_existent_ord' } } } })
    const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    // Should not throw a 400 signature error (may not update DB because order_id is non-existent)
    await service.handleGatewayWebhook('razorpay', JSON.parse(rawBody), validSignature, rawBody)
    assert.isTrue(true)
  })

  test('rejects Stripe webhook when STRIPE_WEBHOOK_SECRET is not configured', async ({ assert }) => {
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_WEBHOOK_SECRET
    try {
      const service = new SubscriptionService()
      await service.handleGatewayWebhook('stripe', {}, 't=123,v1=abc', '{}')
      assert.fail('Expected exception for missing secret')
    } catch (error: any) {
      assert.equal(error.status, 500)
      assert.include(error.message, 'STRIPE_WEBHOOK_SECRET')
    } finally {
      if (originalSecret) process.env.STRIPE_WEBHOOK_SECRET = originalSecret
    }
  })

  test('rejects Stripe webhook when signature header is missing or invalid', async ({ assert }) => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_stripe_secret_123'
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
    const secret = 'whsec_test_stripe_secret_123'
    process.env.STRIPE_WEBHOOK_SECRET = secret
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
