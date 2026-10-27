import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import Employee from '#models/employee'
import Plan from '#models/plan'
import AddonPrice from '#models/addon_price'
import FeatureLimit from '#models/feature_limit'
import AuditLog from '#models/audit_log'
import SubscriptionService from '#services/SubscriptionService'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

test.group('Phase 3B Super Admin Catalog Management APIs Spec', () => {
  async function setupSuperAdmin(): Promise<Employee> {
    await setupTestTenants()
    const defaultPasswordHash = await hash.make('SuperSecureAdminPass123!')
    return await Employee.updateOrCreate(
      { email: 'super.admin.catalog@hrnexus.internal' },
      {
        orgId: null as any,
        roleId: 1, // System Super Admin role
        firstName: 'System',
        lastName: 'SuperAdmin',
        passwordHash: defaultPasswordHash,
        status: 'active',
        emailVerified: true,
      }
    )
  }

  test('1. Verified Super Admin can list, create, update, and toggle plans', async ({ client, assert }) => {
    const superAdmin = await setupSuperAdmin()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    // A. List plans via GET /api/v1/platform/plans
    const listRes = await client.get('/api/v1/platform/plans').loginAs(superAdmin)
    listRes.assertStatus(200)
    assert.isTrue(Array.isArray(listRes.body().data))
    assert.isAbove(listRes.body().data.length, 0)
    const trialPlanInList = listRes.body().data.find((p: any) => p.slug === 'trial')
    assert.isDefined(trialPlanInList)
    assert.isTrue(Array.isArray(trialPlanInList.featureLimits))

    // B. Create a new plan via POST /api/v1/platform/plans
    const createRes = await client
      .post('/api/v1/platform/plans')
      .json({
        name: 'Growth Tier',
        slug: 'growth-tier',
        price: 2499,
        monthlyPrice: 2499,
        yearlyPrice: 24990,
        currency: 'INR',
        userLimit: 50,
        storageLimitMb: 2048,
        durationDays: 30,
        modules: ['ESS', 'Attendance', 'Leaves', 'Visits'],
        isActive: true,
        isPublic: true,
        featureLimits: [
          { featureKey: 'limit.custom_threshold', featureType: 'number', isEnabled: true, limitValue: '50' },
        ],
      })
      .loginAs(superAdmin)
    createRes.assertStatus(201)
    const createdId = createRes.body().data.id
    assert.isDefined(createdId)

    // C. Update plan via PUT /api/v1/platform/plans/:id
    const updateRes = await client
      .put(`/api/v1/platform/plans/${createdId}`)
      .json({
        name: 'Growth Tier Premium',
        price: 2999,
        monthlyPrice: 2999,
        userLimit: 75,
      })
      .loginAs(superAdmin)
    updateRes.assertStatus(200)
    const updatedPlan = await Plan.findOrFail(createdId)
    assert.equal(updatedPlan.name, 'Growth Tier Premium')
    assert.equal(Number(updatedPlan.price), 2999)
    assert.equal(Number(updatedPlan.userLimit), 75)

    // D. Toggle plan status via PATCH /api/v1/platform/plans/:id/toggle
    const toggleRes = await client
      .patch(`/api/v1/platform/plans/${createdId}/toggle`)
      .loginAs(superAdmin)
    toggleRes.assertStatus(200)
    assert.isFalse(Boolean(toggleRes.body().data.isActive))
    const reloaded = await Plan.findOrFail(createdId)
    assert.isFalse(Boolean(reloaded.isActive))
  })

  test('2. Verified Super Admin can list and update add-ons', async ({ client, assert }) => {
    const superAdmin = await setupSuperAdmin()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    // A. List add-ons via GET /api/v1/platform/addons
    const listRes = await client.get('/api/v1/platform/addons').loginAs(superAdmin)
    listRes.assertStatus(200)
    assert.isTrue(Array.isArray(listRes.body().data))
    const attendanceAddon = listRes.body().data.find((a: any) => a.slug === 'attendance')
    assert.isDefined(attendanceAddon)

    // B. Update add-on via PUT /api/v1/platform/addons/:id
    const targetAddon = await AddonPrice.query().where('slug', 'leaveandtimeoff').firstOrFail()
    const updateRes = await client
      .put(`/api/v1/platform/addons/${targetAddon.id}`)
      .json({
        name: 'Leave & Time Off Pro',
        price: 450,
      })
      .loginAs(superAdmin)
    updateRes.assertStatus(200)

    const reloaded = await AddonPrice.findOrFail(targetAddon.id)
    assert.equal(reloaded.name, 'Leave & Time Off Pro')
    assert.equal(Number(reloaded.price), 450)
  })

  test('3. Tenant Admin and unauthenticated requests are rejected', async ({ client }) => {
    const { tenantA } = await setupTestTenants()

    // Unauthenticated GET /api/v1/platform/plans
    const unauthGetPlans = await client.get('/api/v1/platform/plans')
    unauthGetPlans.assertStatus(401)

    // Unauthenticated POST /api/v1/platform/plans
    const unauthPostPlan = await client.post('/api/v1/platform/plans').json({ name: 'Hacked' })
    unauthPostPlan.assertStatus(401)

    // Tenant Admin (role 2) attempts GET /api/v1/platform/plans
    const forbiddenGetPlans = await client.get('/api/v1/platform/plans').loginAs(tenantA.admin)
    forbiddenGetPlans.assertStatus(403)

    // Tenant Admin attempts POST /api/v1/platform/plans
    const forbiddenPostPlan = await client
      .post('/api/v1/platform/plans')
      .json({ name: 'Unauthorized Plan', slug: 'unauth-plan' })
      .loginAs(tenantA.admin)
    forbiddenPostPlan.assertStatus(403)

    // Tenant Admin attempts PUT /api/v1/platform/plans/:id
    const forbiddenPutPlan = await client
      .put('/api/v1/platform/plans/1')
      .json({ price: 1 })
      .loginAs(tenantA.admin)
    forbiddenPutPlan.assertStatus(403)

    // Tenant Admin attempts PATCH /api/v1/platform/plans/:id/toggle
    const forbiddenTogglePlan = await client
      .patch('/api/v1/platform/plans/1/toggle')
      .loginAs(tenantA.admin)
    forbiddenTogglePlan.assertStatus(403)

    // Tenant Admin attempts GET /api/v1/platform/addons
    const forbiddenGetAddons = await client.get('/api/v1/platform/addons').loginAs(tenantA.admin)
    forbiddenGetAddons.assertStatus(403)

    // Tenant Admin attempts PUT /api/v1/platform/addons/:id
    const forbiddenPutAddon = await client
      .put('/api/v1/platform/addons/1')
      .json({ price: 0 })
      .loginAs(tenantA.admin)
    forbiddenPutAddon.assertStatus(403)
  })

  test('4. Invalid prices, limits, modules, dependencies, and duplicate slugs are rejected', async ({ client }) => {
    const superAdmin = await setupSuperAdmin()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    // A. Negative price
    const negPriceRes = await client
      .post('/api/v1/platform/plans')
      .json({ name: 'Negative Plan', slug: 'neg-plan', price: -500 })
      .loginAs(superAdmin)
    negPriceRes.assertStatus(400)

    // B. Invalid user limit (<= 0)
    const zeroLimitRes = await client
      .post('/api/v1/platform/plans')
      .json({ name: 'Zero Limit Plan', slug: 'zero-limit-plan', userLimit: 0 })
      .loginAs(superAdmin)
    zeroLimitRes.assertStatus(400)

    // C. Duplicate slug
    const dupSlugRes = await client
      .post('/api/v1/platform/plans')
      .json({ name: 'Duplicate Basic', slug: 'basic' })
      .loginAs(superAdmin)
    dupSlugRes.assertStatus(400)

    // D. Unknown or unsupported module
    const unknownModRes = await client
      .post('/api/v1/platform/plans')
      .json({ name: 'Rogue Mod Plan', slug: 'rogue-mod-plan', modules: ['ESS', 'SuperAdminSecretModule'] })
      .loginAs(superAdmin)
    unknownModRes.assertStatus(400)

    // E. Missing Attendance Core dependency (e.g., FaceRecognition without Attendance)
    const missingDepRes = await client
      .post('/api/v1/platform/plans')
      .json({ name: 'Face Without Attendance', slug: 'face-no-att', modules: ['ESS', 'FaceRecognition'] })
      .loginAs(superAdmin)
    missingDepRes.assertStatus(400)

    // F. Safe deactivation guard: deactivating default trial plan without another active trial plan
    const trialPlan = await Plan.query().where('slug', 'trial').firstOrFail()
    const deactivateTrialRes = await client
      .patch(`/api/v1/platform/plans/${trialPlan.id}/toggle`)
      .json({ isActive: false })
      .loginAs(superAdmin)
    deactivateTrialRes.assertStatus(400)

    // G. Invalid addon price
    const negAddonPriceRes = await client
      .put('/api/v1/platform/addons/1')
      .json({ price: -100 })
      .loginAs(superAdmin)
    negAddonPriceRes.assertStatus(400)
  })

  test('5. Unknown plan/add-on IDs return appropriate 404 errors', async ({ client }) => {
    const superAdmin = await setupSuperAdmin()

    const unknownPlanPut = await client
      .put('/api/v1/platform/plans/999999')
      .json({ name: 'Ghost' })
      .loginAs(superAdmin)
    unknownPlanPut.assertStatus(404)

    const unknownPlanToggle = await client
      .patch('/api/v1/platform/plans/999999/toggle')
      .loginAs(superAdmin)
    unknownPlanToggle.assertStatus(404)

    const unknownAddonPut = await client
      .put('/api/v1/platform/addons/999999')
      .json({ price: 100 })
      .loginAs(superAdmin)
    unknownAddonPut.assertStatus(404)
  })

  test('6. Catalog edits persist after repeated ensureCatalog() calls', async ({ client, assert }) => {
    const superAdmin = await setupSuperAdmin()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    // 1. Create a custom plan via API
    const customPlanRes = await client
      .post('/api/v1/platform/plans')
      .json({
        name: 'Scale Up Catalog Test',
        slug: 'scale-up-catalog-test',
        price: 3499,
        monthlyPrice: 3499,
        yearlyPrice: 34990,
        userLimit: 120,
        modules: ['ESS', 'Attendance', 'Leaves', 'Expenses'],
      })
      .loginAs(superAdmin)
    customPlanRes.assertStatus(201)
    const planId = customPlanRes.body().data.id

    // 2. Update an add-on via API
    const kioskAddon = await AddonPrice.query().where('slug', 'kiosk').first()
    if (kioskAddon) {
      const addonRes = await client
        .put(`/api/v1/platform/addons/${kioskAddon.id}`)
        .json({ price: 650, name: 'Smart Kiosk Station' })
        .loginAs(superAdmin)
      addonRes.assertStatus(200)
    }

    // 3. Repeatedly call ensureCatalog()
    await subService.ensureCatalog()
    await subService.ensureCatalog()

    // 4. Verify plan & addon maintain their API-updated values
    const reloadedPlan = await Plan.findOrFail(planId)
    assert.equal(reloadedPlan.name, 'Scale Up Catalog Test')
    assert.equal(Number(reloadedPlan.price), 3499)

    if (kioskAddon) {
      const reloadedAddon = await AddonPrice.findOrFail(kioskAddon.id)
      assert.equal(Number(reloadedAddon.price), 650)
      assert.equal(reloadedAddon.name, 'Smart Kiosk Station')
    }
  })

  test('7. Feature-limit updates preserve existing values unless explicitly changed through the approved API', async ({ client, assert }) => {
    const superAdmin = await setupSuperAdmin()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    const basicPlan = await Plan.query().where('slug', 'basic').firstOrFail()

    // Baseline: basic plan has 'limit.users' = 20, 'limit.storage_mb' = 512
    const storageLimitBefore = await FeatureLimit.query()
      .where('planId', basicPlan.id)
      .where('featureKey', 'limit.storage_mb')
      .firstOrFail()
    assert.equal(storageLimitBefore.limitValue, '512')

    // Admin updates ONLY 'limit.users' to 35 via PUT /api/v1/platform/plans/:id
    const putRes = await client
      .put(`/api/v1/platform/plans/${basicPlan.id}`)
      .json({
        featureLimits: [
          { featureKey: 'limit.users', limitValue: '35', isEnabled: true },
        ],
      })
      .loginAs(superAdmin)
    putRes.assertStatus(200)

    // Verify 'limit.users' was updated, but 'limit.storage_mb' was preserved
    const usersLimitAfter = await FeatureLimit.query()
      .where('planId', basicPlan.id)
      .where('featureKey', 'limit.users')
      .firstOrFail()
    assert.equal(usersLimitAfter.limitValue, '35')

    const storageLimitAfter = await FeatureLimit.query()
      .where('planId', basicPlan.id)
      .where('featureKey', 'limit.storage_mb')
      .firstOrFail()
    assert.equal(storageLimitAfter.limitValue, '512')
  })

  test('8. Audit events are recorded for successful mutations', async ({ client, assert }) => {
    const superAdmin = await setupSuperAdmin()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    // 1. Create plan mutation
    const createRes = await client
      .post('/api/v1/platform/plans')
      .json({
        name: 'Audited Plan Test',
        slug: 'audited-plan-test',
        price: 999,
        modules: ['ESS', 'Attendance', 'Leaves'],
      })
      .loginAs(superAdmin)
    createRes.assertStatus(201)
    const planId = createRes.body().data.id

    // Check AuditLog for CREATE_PLAN
    const createLog = await AuditLog.query()
      .where('action', 'CREATE_PLAN')
      .where('entityName', 'Plan')
      .where('entityId', String(planId))
      .first()
    assert.isNotNull(createLog)
    assert.equal(createLog!.employeeId, superAdmin.id)

    // 2. Update plan mutation
    const updateRes = await client
      .put(`/api/v1/platform/plans/${planId}`)
      .json({ name: 'Audited Plan Test Renamed' })
      .loginAs(superAdmin)
    updateRes.assertStatus(200)

    const updateLog = await AuditLog.query()
      .where('action', 'UPDATE_PLAN')
      .where('entityName', 'Plan')
      .where('entityId', String(planId))
      .first()
    assert.isNotNull(updateLog)

    // 3. Update add-on mutation
    const firstAddon = await AddonPrice.firstOrFail()
    const addonUpdateRes = await client
      .put(`/api/v1/platform/addons/${firstAddon.id}`)
      .json({ price: 399 })
      .loginAs(superAdmin)
    addonUpdateRes.assertStatus(200)

    const addonLog = await AuditLog.query()
      .where('action', 'UPDATE_ADDON')
      .where('entityName', 'AddonPrice')
      .where('entityId', String(firstAddon.id))
      .first()
    assert.isNotNull(addonLog)
  })

  test('9. Active subscription safety: cannot remove modules from a plan with active paid subscriptions', async ({ client, assert }) => {
    const superAdmin = await setupSuperAdmin()
    const { tenantA } = await setupTestTenants()
    const subService = new SubscriptionService()
    await subService.ensureCatalog()

    // Create a plan with Attendance & Leaves
    const plan = await Plan.create({
      name: 'Safe Active Plan',
      slug: 'safe-active-plan',
      price: 1999,
      monthlyPrice: 1999,
      yearlyPrice: 19990,
      currency: 'INR',
      userLimit: 50,
      storageLimitMb: 1024,
      durationDays: 30,
      modules: JSON.stringify(['ESS', 'Attendance', 'Leaves']),
      isActive: true,
      isPublic: true,
      isTrialPlan: false,
      sortOrder: 10,
    })

    // Tenant A is actively subscribed to this plan
    await db.table('subscriptions').insert({
      org_id: tenantA.org.id,
      plan_id: plan.id,
      status: 'active',
      billing_cycle: 'monthly',
      start_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    })

    // Super Admin attempts to remove 'Leaves' from this plan
    const unsafeRemoveRes = await client
      .put(`/api/v1/platform/plans/${plan.id}`)
      .json({
        modules: ['ESS', 'Attendance'], // 'Leaves' was removed
      })
      .loginAs(superAdmin)

    // Must be rejected with 400 Bad Request to protect active subscriber entitlements
    unsafeRemoveRes.assertStatus(400)
    assert.include(unsafeRemoveRes.body().message, 'active paid subscriptions')

    // However, ADDING a module (e.g. 'Visits') must be allowed
    const safeAddRes = await client
      .put(`/api/v1/platform/plans/${plan.id}`)
      .json({
        modules: ['ESS', 'Attendance', 'Leaves', 'Visits'],
      })
      .loginAs(superAdmin)
    safeAddRes.assertStatus(200)
  })

  test('10. Dual routing compatibility: /api/v1/platform and /api/platform both work identically', async ({ client }) => {
    const superAdmin = await setupSuperAdmin()

    // Test GET on /api/v1/platform/plans
    const v1Res = await client.get('/api/v1/platform/plans').loginAs(superAdmin)
    v1Res.assertStatus(200)

    // Test GET on /api/platform/plans
    const standardRes = await client.get('/api/platform/plans').loginAs(superAdmin)
    standardRes.assertStatus(200)

    // Test GET on /api/v1/platform/addons
    const v1AddonRes = await client.get('/api/v1/platform/addons').loginAs(superAdmin)
    v1AddonRes.assertStatus(200)

    // Test GET on /api/platform/addons
    const standardAddonRes = await client.get('/api/platform/addons').loginAs(superAdmin)
    standardAddonRes.assertStatus(200)
  })
})
