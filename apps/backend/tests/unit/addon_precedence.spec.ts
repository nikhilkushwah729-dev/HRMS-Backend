import { test } from '@japa/runner'
import Organization from '#models/organization'
import SubscriptionService from '#services/SubscriptionService'
import AddonPrice from '#models/addon_price'
import db from '@adonisjs/lucid/services/db'

test.group('Payroll Lock & Addon Precedence Spec (Priority 6 & 3)', () => {
  test('locks Payroll by default across plans and verifies add-on catalog deactivation', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const org = await Organization.create({
      companyName: 'Payroll Lock Test Org',
      slug: `payroll-lock-test-${Date.now()}`,
      email: 'payroll.lock@test.com',
      isTrialActive: false,
      subscriptionStatus: 'active',
      readOnlyMode: false,
      planId: 3, // Pro plan
    })

    // Test Payroll module evaluation without explicit addon row
    const result = await service.evaluateFeatureAccess(org.id, 'Payroll')
    assert.isFalse(result.allowed)
    assert.include(result.reason || '', 'Payroll')

    // Verify AddonPrice catalog entry for payroll has isActive = false
    const payrollAddon = await AddonPrice.findBy('slug', 'payroll')
    assert.isNotNull(payrollAddon)
    assert.isFalse(Boolean(payrollAddon?.isActive))

    await org.delete()
  })

  test('evaluates organization_addons precedence (Level 2 Active Override > Level 3 Deactivated Override)', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const org = await Organization.create({
      companyName: 'Addon Precedence Test Org',
      slug: `addon-precedence-test-${Date.now()}`,
      email: 'addon.precedence@test.com',
      isTrialActive: false,
      subscriptionStatus: 'active',
      readOnlyMode: false,
      planId: 3, // Pro plan
    })

    const payrollAddon = await AddonPrice.findByOrFail('slug', 'payroll')

    // Level 2: Grant explicit active add-on in organization_addons
    await db.table('organization_addons').insert({
      org_id: org.id,
      addon_id: payrollAddon.id,
      start_date: new Date(),
      is_active: true,
      created_at: new Date(),
    })

    const grantedResult = await service.evaluateFeatureAccess(org.id, 'Payroll')
    assert.isTrue(grantedResult.allowed)
    assert.isNull(grantedResult.reason)

    // Level 3: Update organization_addons to is_active = false (explicit revoke)
    await db.from('organization_addons').where('org_id', org.id).where('addon_id', payrollAddon.id).update({
      is_active: false,
    })

    const revokedResult = await service.evaluateFeatureAccess(org.id, 'Payroll')
    assert.isFalse(revokedResult.allowed)
    assert.include(revokedResult.reason || '', 'deactivated')

    // Cleanup
    await db.from('organization_addons').where('org_id', org.id).delete()
    await org.delete()
  })

  test('fails closed on unexpected database error during feature access evaluation', async ({ assert }) => {
    const service = new SubscriptionService()

    const originalFind = Organization.find
    Organization.find = (async () => {
      throw new Error('Database connection failure simulation')
    }) as any

    try {
      const failClosedResult = await service.evaluateFeatureAccess(9999, 'ESS')
      assert.isFalse(failClosedResult.allowed)
      assert.equal(failClosedResult.subscriptionStatus, 'unknown')
      assert.isTrue(failClosedResult.readOnly)
      assert.include(failClosedResult.reason || '', 'Unable to verify subscription access')
    } finally {
      Organization.find = originalFind
    }
  })
})
