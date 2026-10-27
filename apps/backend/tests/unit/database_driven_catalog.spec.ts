import { test } from '@japa/runner'
import SubscriptionService from '#services/SubscriptionService'
import Plan from '#models/plan'
import FeatureLimit from '#models/feature_limit'
import AddonPrice from '#models/addon_price'
import db from '@adonisjs/lucid/services/db'
import { setupTestTenants } from '#tests/helpers/tenant_harness'

test.group('Phase 3A Database-Driven Subscription Catalog Spec', () => {
  test('1. Administrator-edited plan price survives repeated ensureCatalog() calls', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    // 1. Locate baseline 'basic' plan
    const basicPlan = await Plan.query().where('slug', 'basic').firstOrFail()

    // 2. Admin edits prices (e.g., ₹999 -> ₹1,499, yearly ₹9,990 -> ₹14,990)
    basicPlan.price = 1499
    basicPlan.monthlyPrice = 1499
    basicPlan.yearlyPrice = 14990
    await basicPlan.save()

    // 3. Re-run ensureCatalog() multiple times
    await service.ensureCatalog()
    await service.ensureCatalog()

    // 4. Verify admin edited prices are NOT overwritten
    const reloaded = await Plan.query().where('slug', 'basic').firstOrFail()
    assert.equal(Number(reloaded.price), 1499)
    assert.equal(Number(reloaded.monthlyPrice), 1499)
    assert.equal(Number(reloaded.yearlyPrice), 14990)
  })

  test('2. Edited plan modules, seat limits, active status, and visibility survive repeated calls', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const proPlan = await Plan.query().where('slug', 'pro').firstOrFail()

    // Admin edits: seat limit, modules, active status, and visibility
    proPlan.userLimit = 250
    proPlan.modules = JSON.stringify(['ESS', 'Attendance', 'Leaves', 'CustomModule'])
    proPlan.isActive = false
    proPlan.isPublic = false
    await proPlan.save()

    // Re-run ensureCatalog() multiple times
    await service.ensureCatalog()
    await service.ensureCatalog()

    const reloaded = await Plan.query().where('slug', 'pro').firstOrFail()
    assert.equal(Number(reloaded.userLimit), 250)
    assert.deepEqual(JSON.parse(reloaded.modules), ['ESS', 'Attendance', 'Leaves', 'CustomModule'])
    assert.isFalse(Boolean(reloaded.isActive))
    assert.isFalse(Boolean(reloaded.isPublic))
  })

  test('3. Administrator-edited add-on price and active status survive repeated calls', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const faceAddon = await AddonPrice.query().where('slug', 'facerecognition').firstOrFail()

    // Admin updates price: ₹1,000 -> ₹1,500 and deactivates it
    faceAddon.price = 1500
    faceAddon.isActive = false
    await faceAddon.save()

    // Also test payroll (which is default inactive) activated by admin
    const payrollAddon = await AddonPrice.query().where('slug', 'payroll').firstOrFail()
    payrollAddon.isActive = true
    payrollAddon.price = 750
    await payrollAddon.save()

    // Re-run ensureCatalog() multiple times
    await service.ensureCatalog()
    await service.ensureCatalog()

    const reloadedFace = await AddonPrice.query().where('slug', 'facerecognition').firstOrFail()
    assert.equal(Number(reloadedFace.price), 1500)
    assert.isFalse(Boolean(reloadedFace.isActive))

    const reloadedPayroll = await AddonPrice.query().where('slug', 'payroll').firstOrFail()
    assert.equal(Number(reloadedPayroll.price), 750)
    assert.isTrue(Boolean(reloadedPayroll.isActive))
  })

  test('4. Missing baseline catalog records are seeded safely on fresh start', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const plans = await Plan.all()
    const slugs = plans.map((p) => p.slug)

    assert.include(slugs, 'trial')
    assert.include(slugs, 'basic')
    assert.include(slugs, 'pro')
    assert.include(slugs, 'enterprise')

    const addons = await AddonPrice.all()
    const addonSlugs = addons.map((a) => a.slug)
    assert.include(addonSlugs, 'attendance')
    assert.include(addonSlugs, 'leaveandtimeoff')
    assert.include(addonSlugs, 'facerecognition')
    assert.include(addonSlugs, 'geofence')
  })

  test('5. Partially populated catalog does not overwrite existing records when creating missing ones', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    // Ensure 'basic' has custom values
    const basicPlan = await Plan.query().where('slug', 'basic').firstOrFail()
    basicPlan.price = 888
    basicPlan.userLimit = 35
    await basicPlan.save()

    // Delete 'enterprise' to simulate a partially populated catalog
    await db.from('feature_limits').whereIn('plan_id', (q) => q.from('plans').where('slug', 'enterprise').select('id')).delete()
    await db.from('plans').where('slug', 'enterprise').delete()

    const enterpriseBefore = await Plan.query().where('slug', 'enterprise').first()
    assert.isNull(enterpriseBefore)

    // Call ensureCatalog() to seed only missing entries
    await service.ensureCatalog()

    // Enterprise should now be recreated
    const enterpriseAfter = await Plan.query().where('slug', 'enterprise').first()
    assert.isNotNull(enterpriseAfter)

    // Basic should NOT have been overwritten
    const basicReloaded = await Plan.query().where('slug', 'basic').firstOrFail()
    assert.equal(Number(basicReloaded.price), 888)
    assert.equal(Number(basicReloaded.userLimit), 35)
  })

  test('6. Existing feature-limit values remain unchanged across ensureCatalog() calls', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const basicPlan = await Plan.query().where('slug', 'basic').firstOrFail()
    const leavesLimit = await FeatureLimit.query()
      .where('planId', basicPlan.id)
      .where('featureKey', 'module.Leaves')
      .firstOrFail()

    // Admin disables leaves module in feature limits
    leavesLimit.isEnabled = false
    await leavesLimit.save()

    // Re-run ensureCatalog() multiple times
    await service.ensureCatalog()
    await service.ensureCatalog()

    const reloadedLimit = await FeatureLimit.query()
      .where('planId', basicPlan.id)
      .where('featureKey', 'module.Leaves')
      .firstOrFail()

    assert.isFalse(Boolean(reloadedLimit.isEnabled))
  })

  test('7. Missing feature-limit entries are added safely and idempotently', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const basicPlan = await Plan.query().where('slug', 'basic').firstOrFail()

    // Delete one feature limit
    await db.from('feature_limits').where('plan_id', basicPlan.id).where('feature_key', 'limit.storage_mb').delete()

    const deletedCheck = await FeatureLimit.query().where('planId', basicPlan.id).where('featureKey', 'limit.storage_mb').first()
    assert.isNull(deletedCheck)

    // Run ensureCatalog() to safely add the missing entry
    await service.ensureCatalog()

    const restoredLimit = await FeatureLimit.query().where('planId', basicPlan.id).where('featureKey', 'limit.storage_mb').first()
    assert.isNotNull(restoredLimit)
    assert.equal(restoredLimit?.limitValue, '512')

    // Run again to ensure no duplicate key errors occur
    await service.ensureCatalog()
    const count = await FeatureLimit.query().where('planId', basicPlan.id).where('featureKey', 'limit.storage_mb').count('* as total')
    assert.equal(Number(count[0].$extras.total), 1)
  })

  test('8. Attendance and Leaves remain independently entitled after safe catalog initialization', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const service = new SubscriptionService()
    await service.ensureCatalog()

    // Both are allowed by default for Tenant A on Pro
    const attVerdict = await service.evaluateFeatureAccess(tenantA.org.id, 'attendance')
    assert.isTrue(attVerdict.allowed)

    const leaveVerdict = await service.evaluateFeatureAccess(tenantA.org.id, 'leaves')
    assert.isTrue(leaveVerdict.allowed)

    // Deactivate attendance via organization_addons
    const attendanceAddon = await AddonPrice.query().where('slug', 'attendance').firstOrFail()
    await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
    await db.table('organization_addons').insert({
      org_id: tenantA.org.id,
      addon_id: attendanceAddon.id,
      is_active: false,
      start_date: new Date(),
      created_at: new Date(),
    })

    // Attendance is now blocked, but Leaves remains ALLOWED
    const attVerdictBlocked = await service.evaluateFeatureAccess(tenantA.org.id, 'attendance')
    assert.isFalse(attVerdictBlocked.allowed)

    const leaveVerdictStillAllowed = await service.evaluateFeatureAccess(tenantA.org.id, 'leaves')
    assert.isTrue(leaveVerdictStillAllowed.allowed)

    // Cleanup
    await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
  })

  test('9. Existing trial/subscription behavior and current entitlement flow remain compatible', async ({ assert }) => {
    const service = new SubscriptionService()
    await service.ensureCatalog()

    const plans = await service.listPlans()
    assert.isArray(plans)
    assert.isTrue(plans.length >= 3) // basic, pro, enterprise are public

    // Verify trial plan exists and has isTrialPlan = true
    const trialPlan = await Plan.query().where('slug', 'trial').firstOrFail()
    assert.isTrue(Boolean(trialPlan.isTrialPlan))
  })

  test('10. Repeated initialization does not create duplicate plans or add-ons', async ({ assert }) => {
    const service = new SubscriptionService()

    await service.ensureCatalog()
    const planCount1 = await Plan.query().count('* as total')
    const addonCount1 = await AddonPrice.query().count('* as total')

    await service.ensureCatalog()
    await service.ensureCatalog()
    const planCount2 = await Plan.query().count('* as total')
    const addonCount2 = await AddonPrice.query().count('* as total')

    assert.equal(Number(planCount1[0].$extras.total), Number(planCount2[0].$extras.total))
    assert.equal(Number(addonCount1[0].$extras.total), Number(addonCount2[0].$extras.total))
  })
})
