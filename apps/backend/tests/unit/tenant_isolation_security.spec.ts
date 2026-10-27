import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import Employee from '#models/employee'
import Leave from '#models/leave'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import crypto from 'node:crypto'
import env from '#start/env'
import { DateTime } from 'luxon'

test.group('Phase 1 Tenant Isolation & Security Spec', () => {
  test('1. Cross-Tenant ID Tampering: Tenant Alpha Admin cannot view, edit, or delete Tenant Beta records by ID', async ({ client }) => {
    const { tenantA, tenantB } = await setupTestTenants()

    // 1. Tenant Alpha Admin attempts to view Tenant Beta Employee by ID
    const showBetaEmpResponse = await client.get(`/api/employees/${tenantB.employee.id}`).loginAs(tenantA.admin)
    showBetaEmpResponse.assertStatus(404)

    // 2. Tenant Alpha Admin attempts to update Tenant Beta Employee by ID
    const updateBetaEmpResponse = await client
      .put(`/api/employees/${tenantB.employee.id}`)
      .json({ firstName: 'Tampered' })
      .loginAs(tenantA.admin)
    updateBetaEmpResponse.assertStatus(404)

    // 3. Tenant Alpha Admin attempts to delete Tenant Beta Employee by ID
    const deleteBetaEmpResponse = await client.delete(`/api/employees/${tenantB.employee.id}`).loginAs(tenantA.admin)
    deleteBetaEmpResponse.assertStatus(404)

    // 4. Create a Leave in Tenant B and verify Tenant A cannot approve/reject it
    const [betaLeaveTypeId] = await db.table('leave_types').insert({
      org_id: tenantB.org.id,
      type_name: 'Beta Sick Leave',
      days_allowed: 10,
      carry_forward: false,
      max_carry_days: 0,
      is_paid: true,
      requires_doc: false,
    })

    const betaLeave = await Leave.create({
      employeeId: tenantB.employee.id,
      orgId: tenantB.org.id,
      leaveTypeId: Number(betaLeaveTypeId),
      startDate: DateTime.now().plus({ days: 2 }),
      endDate: DateTime.now().plus({ days: 3 }),
      reason: 'Confidential Beta Leave',
      status: 'pending',
    })

    const tamperedApprovalResponse = await client
      .put(`/api/leaves/${betaLeave.id}/status`)
      .json({ status: 'approved' })
      .loginAs(tenantA.admin)
    tamperedApprovalResponse.assertStatus(404)

    // 5. Ensure timesheet add-on is active for Tenant A so it evaluates resource-level 404 isolation
    const timesheetAddon = await db.from('addon_prices').where('slug', 'timesheet').first()
    if (timesheetAddon) {
      await db.table('organization_addons').insert({
        org_id: tenantA.org.id,
        addon_id: timesheetAddon.id,
        start_date: new Date(),
        is_active: true,
        created_at: new Date(),
      })
    }

    const [betaTimesheetId] = await db.table('timesheets').insert({
      employee_id: tenantB.employee.id,
      org_id: tenantB.org.id,
      log_date: DateTime.now().toISODate(),
      hours_logged: 8,
      status: 'draft',
      created_at: new Date(),
    })

    const tamperedTimesheetResponse = await client
      .get(`/api/timesheets/${betaTimesheetId}`)
      .loginAs(tenantA.admin)
    tamperedTimesheetResponse.assertStatus(404)
  }).timeout(10000)

  test('2. List Isolation: Tenant Alpha list endpoints strictly exclude Tenant Beta records', async ({ client, assert }) => {
    const { tenantA, tenantB } = await setupTestTenants()

    // Query employees as Tenant Alpha Admin
    const empResponse = await client.get('/api/employees').loginAs(tenantA.admin)
    empResponse.assertStatus(200)

    const empList = empResponse.body().data as Array<any>
    assert.isAbove(empList.length, 0)
    // Assert every single returned employee belongs to Tenant A, not Tenant B
    for (const emp of empList) {
      assert.notEqual(Number(emp.id), Number(tenantB.admin.id))
      assert.notEqual(Number(emp.id), Number(tenantB.employee.id))
    }

    // Query organization profile as Tenant Alpha Admin
    const orgResponse = await client.get('/api/organization').loginAs(tenantA.admin)
    orgResponse.assertStatus(200)
    const orgBody = orgResponse.body() as any
    const orgId = orgBody.data?.id || orgBody.id
    assert.equal(Number(orgId), tenantA.org.id)
    assert.notEqual(Number(orgId), tenantB.org.id)
  }).timeout(10000)

  test('3. Public Endpoints: Registration, login, and public endpoints work without authentication', async ({ client, assert }) => {
    // 1. Countries list (public)
    const countriesResponse = await client.get('/api/auth/countries')
    countriesResponse.assertStatus(200)

    // 2. Health check (public)
    const healthResponse = await client.get('/')
    healthResponse.assertStatus(200)

    // 3. Public registration flow
    const uniqueEmail = `public.signup.${Date.now()}@example.com`
    const registerResponse = await client.post('/api/auth/register').json({
      companyName: 'Open Public Startup',
      email: uniqueEmail,
      adminFirstName: 'Raj',
      adminLastName: 'Kumar',
      adminPassword: 'Password123!',
      phone: '+919876543210',
      dialCode: '+91',
    })

    assert.include([200, 201], registerResponse.status())
    assert.isNotNull(registerResponse.body().orgId)
  }).timeout(10000)

  test('4. Webhook Endpoints: Signed Razorpay webhooks work without user authentication', async ({ client }) => {
    const secret = env.get('RAZORPAY_WEBHOOK_SECRET') || 'rzp_wh_secret_dev_3333_local'
    const payload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_phase1_isolation',
            order_id: 'order_test_phase1',
            status: 'captured',
            amount: 149900,
            currency: 'INR',
          },
        },
      },
    }
    const rawBody = JSON.stringify(payload)
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    // Webhook POST without Bearer token must succeed (no tenant middleware blocking)
    const webhookResponse = await client
      .post('/api/billing/webhooks/razorpay')
      .header('x-razorpay-signature', signature)
      .json(payload)

    webhookResponse.assertStatus(200)
  }).timeout(10000)

  test('5. Platform Super Admin Security: Regular tenant admins are forbidden; verified Super Admin is allowed', async ({ client }) => {
    const { tenantA } = await setupTestTenants()

    // 1. Tenant Alpha Admin (role 2) attempts to create a new organization on platform
    const forbiddenCreateResponse = await client
      .post('/api/platform/organizations')
      .json({ companyName: 'Unauthorized Rogue Tenant' })
      .loginAs(tenantA.admin)
    forbiddenCreateResponse.assertStatus(403)

    // 2. Tenant Alpha Admin attempts to delete Tenant Beta via platform API
    const forbiddenDeleteResponse = await client
      .delete('/api/platform/organizations/1002')
      .loginAs(tenantA.admin)
    forbiddenDeleteResponse.assertStatus(403)

    // 3. Provision verified system Super Admin (roleId: 1, isSystem: true, orgId: null)
    const defaultPasswordHash = await hash.make('SuperSecurePass123!')
    const superAdmin = await Employee.updateOrCreate(
      { email: 'super.admin.verified@hrnexus.internal' },
      {
        orgId: null as any,
        roleId: 1,
        firstName: 'System',
        lastName: 'SuperAdmin',
        passwordHash: defaultPasswordHash,
        status: 'active',
        emailVerified: true,
      }
    )

    // Verified Super Admin can access platform overview
    const overviewResponse = await client.get('/api/platform/overview').loginAs(superAdmin)
    overviewResponse.assertStatus(200)
  }).timeout(10000)

  test('6. Non-Regression: Authenticated core workflows (attendance, leaves, payroll) function normally', async ({ client }) => {
    const { tenantA } = await setupTestTenants()

    // Check attendance history
    const attResponse = await client.get('/api/attendance/history').loginAs(tenantA.admin)
    attResponse.assertStatus(200)

    // Check leaves list
    const leavesResponse = await client.get('/api/leaves').loginAs(tenantA.admin)
    leavesResponse.assertStatus(200)

    // Check payroll list
    const payrollResponse = await client.get('/api/payroll').loginAs(tenantA.admin)
    payrollResponse.assertStatus(200)
  }).timeout(10000)
})
