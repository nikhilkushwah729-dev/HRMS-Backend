import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import Organization from '#models/organization'
import Subscription from '#models/subscription'
import SubscriptionService from '#services/SubscriptionService'

test.group('Trial Expiry & Subscription Automation Spec (Priority 2)', () => {
  test('automatically transitions expired trial organization to read-only mode', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    // Create an organization with an expired trial date (2 days ago)
    const org = await Organization.create({
      companyName: 'Expired Trial Org Test',
      slug: `expired-trial-org-${Date.now()}`,
      email: 'trial.expired@testorg.com',
      isTrialActive: true,
      subscriptionStatus: 'trialing',
      trialStartDate: DateTime.now().minus({ days: 9 }),
      trialEndDate: DateTime.now().minus({ days: 2 }),
      readOnlyMode: false,
    })

    await Subscription.create({
      orgId: org.id,
      status: 'trialing',
      billingCycle: 'trial',
      startDate: DateTime.now().minus({ days: 9 }),
      endDate: DateTime.now().minus({ days: 2 }),
      trialStartDate: DateTime.now().minus({ days: 9 }),
      trialEndDate: DateTime.now().minus({ days: 2 }),
      autoRenew: false,
    })

    // Execute syncTrialStatuses
    await service.syncTrialStatuses(org.id)

    // Re-fetch organization
    const updatedOrg = await Organization.findOrFail(org.id)

    assert.isFalse(Boolean(updatedOrg.isTrialActive))
    assert.equal(updatedOrg.subscriptionStatus, 'expired')
    assert.isTrue(Boolean(updatedOrg.readOnlyMode))
    assert.isNotNull(updatedOrg.gracePeriodEndDate)

    // Re-fetch subscription
    const sub = await Subscription.query().where('orgId', org.id).orderBy('id', 'desc').first()
    assert.equal(sub?.status, 'expired')

    // Test Idempotency: Running it a second time should not throw or alter valid status
    await service.syncTrialStatuses(org.id)
    const idempotentOrg = await Organization.findOrFail(org.id)
    assert.equal(idempotentOrg.subscriptionStatus, 'expired')
    assert.isTrue(Boolean(idempotentOrg.readOnlyMode))

    // Cleanup
    await Subscription.query().where('orgId', org.id).delete()
    await org.delete()
  })

  test('automatically transitions expired paid subscription to grace period and read-only mode', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const org = await Organization.create({
      companyName: 'Expired Paid Org Test',
      slug: `expired-paid-org-${Date.now()}`,
      email: 'paid.expired@testorg.com',
      isTrialActive: false,
      subscriptionStatus: 'active',
      planEndDate: DateTime.now().minus({ days: 1 }),
      readOnlyMode: false,
    })

    // Execute syncTrialStatuses
    await service.syncTrialStatuses(org.id)

    const updatedOrg = await Organization.findOrFail(org.id)
    assert.equal(updatedOrg.subscriptionStatus, 'grace')
    assert.isTrue(Boolean(updatedOrg.readOnlyMode))
    assert.isNotNull(updatedOrg.gracePeriodEndDate)

    // Cleanup
    await org.delete()
  })
})
