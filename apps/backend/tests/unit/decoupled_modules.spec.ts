import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import db from '@adonisjs/lucid/services/db'
import SubscriptionService from '#services/SubscriptionService'

test.group('Phase 2 Decoupled Attendance & Leave Entitlements Spec', () => {
  test('1. Leave-Only Tenant: Leave routes allowed, Attendance routes return 402 Payment Required', async ({ client, assert }) => {
    const { tenantA } = await setupTestTenants()
    const subscriptionService = new SubscriptionService()
    await subscriptionService.ensureCatalog()

    // Explicitly deactivate Attendance for Tenant A while keeping Leaves active
    const attendanceAddon = await db.from('addon_prices').where('slug', 'attendance').first()
    if (attendanceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: attendanceAddon.id,
        is_active: false,
        start_date: new Date(),
        created_at: new Date(),
      })
    }

    // 1. Leave access check
    const leavesResponse = await client.get('/api/leaves').loginAs(tenantA.admin)
    leavesResponse.assertStatus(200)

    const leaveTypesResponse = await client.get('/api/leave-types').loginAs(tenantA.admin)
    leaveTypesResponse.assertStatus(200)

    // 2. Attendance check-in must be blocked with 402
    const checkInResponse = await client
      .post('/api/attendance/check-in')
      .json({ type: 'web', location: { latitude: 28.6139, longitude: 77.209 } })
      .loginAs(tenantA.employee)

    checkInResponse.assertStatus(402)
    assert.include(checkInResponse.body().message, 'deactivated')

    // Clean up
    if (attendanceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
    }
  }).timeout(10000)

  test('2. Attendance-Only Tenant: Attendance routes allowed, Leave routes return 402 Payment Required', async ({ client, assert }) => {
    const { tenantA } = await setupTestTenants()
    const subscriptionService = new SubscriptionService()
    await subscriptionService.ensureCatalog()

    // Explicitly deactivate Leaves for Tenant A while Attendance remains active
    const leaveAddon = await db.from('addon_prices').where('slug', 'leaveandtimeoff').first()
    if (leaveAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', leaveAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: leaveAddon.id,
        is_active: false,
        start_date: new Date(),
        created_at: new Date(),
      })
    }

    // 1. Attendance check-in or history should NOT return 402
    const historyResponse = await client.get('/api/attendance/history').loginAs(tenantA.employee)
    assert.notEqual(historyResponse.status(), 402)

    // 2. Leave routes must be blocked with 402
    const leavesResponse = await client.get('/api/leaves').loginAs(tenantA.admin)
    leavesResponse.assertStatus(402)
    assert.include(leavesResponse.body().message, 'deactivated')

    const leaveTypesResponse = await client.get('/api/leave-types').loginAs(tenantA.admin)
    leaveTypesResponse.assertStatus(402)

    // Clean up
    if (leaveAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', leaveAddon.id).delete()
    }
  }).timeout(10000)

  test('3. Both Modules Enabled: Both Attendance and Leave routes function without 402', async ({ client, assert }) => {
    const { tenantA } = await setupTestTenants()

    // Tenant A is on Pro plan which includes Attendance and Leaves
    const leavesResponse = await client.get('/api/leaves').loginAs(tenantA.admin)
    leavesResponse.assertStatus(200)

    const attendanceHistoryResponse = await client.get('/api/attendance/history').loginAs(tenantA.employee)
    assert.notEqual(attendanceHistoryResponse.status(), 402)
  }).timeout(10000)

  test('4. Neither Module Enabled: Both Attendance and Leave routes return 402 Payment Required', async ({ client }) => {
    const { tenantA } = await setupTestTenants()
    const subscriptionService = new SubscriptionService()
    await subscriptionService.ensureCatalog()

    const attendanceAddon = await db.from('addon_prices').where('slug', 'attendance').first()
    const leaveAddon = await db.from('addon_prices').where('slug', 'leaveandtimeoff').first()

    if (attendanceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: attendanceAddon.id,
        is_active: false,
        start_date: new Date(),
        created_at: new Date(),
      })
    }
    if (leaveAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', leaveAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: leaveAddon.id,
        is_active: false,
        start_date: new Date(),
        created_at: new Date(),
      })
    }

    const leavesResponse = await client.get('/api/leaves').loginAs(tenantA.admin)
    leavesResponse.assertStatus(402)

    const checkInResponse = await client
      .post('/api/attendance/check-in')
      .json({ type: 'web', location: { latitude: 28.6139, longitude: 77.209 } })
      .loginAs(tenantA.employee)
    checkInResponse.assertStatus(402)

    // Clean up
    if (attendanceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
    }
    if (leaveAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', leaveAddon.id).delete()
    }
  }).timeout(10000)

  test('5. Advanced Attendance Dependency: Face Recognition and Kiosk blocked when Attendance Core is disabled', async ({ client, assert }) => {
    const { tenantA } = await setupTestTenants()
    const subscriptionService = new SubscriptionService()
    await subscriptionService.ensureCatalog()

    const attendanceAddon = await db.from('addon_prices').where('slug', 'attendance').first()
    const faceAddon = await db.from('addon_prices').where('slug', 'facerecognition').first()
    const kioskAddon = await db.from('addon_prices').where('slug', 'kiosk').first()

    // 1. Deactivate Attendance Core
    if (attendanceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: attendanceAddon.id,
        is_active: false,
        start_date: new Date(),
        created_at: new Date(),
      })
    }

    // 2. Explicitly ACTIVATE Face Recognition & Kiosk
    if (faceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', faceAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: faceAddon.id,
        is_active: true,
        start_date: new Date(),
        created_at: new Date(),
      })
    }
    if (kioskAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', kioskAddon.id).delete()
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: kioskAddon.id,
        is_active: true,
        start_date: new Date(),
        created_at: new Date(),
      })
    }

    // Direct Service evaluation of Face Recognition must fail due to missing Attendance Core dependency
    const faceVerdict = await subscriptionService.evaluateFeatureAccess(tenantA.org.id, 'facerecognition')
    assert.isFalse(faceVerdict.allowed)
    assert.include(faceVerdict.reason, 'requires an active Attendance Core subscription')

    // Direct Service evaluation of Kiosk must fail due to missing Attendance Core dependency
    const kioskVerdict = await subscriptionService.evaluateFeatureAccess(tenantA.org.id, 'kiosk')
    assert.isFalse(kioskVerdict.allowed)
    assert.include(kioskVerdict.reason, 'requires an active Attendance Core subscription')

    // HTTP route access to Kiosks should return 402 with dependency reason
    const kioskRouteResponse = await client.get('/api/kiosks').loginAs(tenantA.admin)
    kioskRouteResponse.assertStatus(402)
    assert.include(kioskRouteResponse.body().message, 'requires an active Attendance Core subscription')

    // Clean up
    if (attendanceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', attendanceAddon.id).delete()
    }
    if (faceAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', faceAddon.id).delete()
    }
    if (kioskAddon) {
      await db.from('organization_addons').where('org_id', tenantA.org.id).where('addon_id', kioskAddon.id).delete()
    }
  }).timeout(10000)

  test('6. Backward Compatibility: Default plan bundles both Attendance and Leaves for active subscriptions', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const subscriptionService = new SubscriptionService()
    await subscriptionService.ensureCatalog()

    const attendanceVerdict = await subscriptionService.evaluateFeatureAccess(tenantA.org.id, 'attendance')
    assert.isTrue(attendanceVerdict.allowed, `attendance failed: ${attendanceVerdict.reason} (readOnly: ${attendanceVerdict.readOnly}, status: ${attendanceVerdict.subscriptionStatus})`)

    const leaveVerdict = await subscriptionService.evaluateFeatureAccess(tenantA.org.id, 'leaves')
    assert.isTrue(leaveVerdict.allowed, `leaves failed: ${leaveVerdict.reason}`)

    const leaveSingularVerdict = await subscriptionService.evaluateFeatureAccess(tenantA.org.id, 'leave')
    assert.isTrue(leaveSingularVerdict.allowed)
  }).timeout(10000)
})
