import { test } from '@japa/runner'
import LeavesController from '#controllers/Http/LeavesController'
import db from '@adonisjs/lucid/services/db'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Leave from '#models/leave'
import Payroll from '#models/payroll'
import { setupTestTenants } from '../helpers/tenant_harness.js'

test.group('Half Day Leave & HTTP Endpoint Verification', () => {
  test('validates and persists durationType and halfDaySession in leaves database table', async ({ assert }) => {
    const rawPayload = {
      leaveTypeId: 1,
      startDate: '2026-10-01',
      endDate: '2026-10-01',
      reason: 'Doctor appointment',
      durationType: 'half_day',
      halfDaySession: 'first_half',
      requestKind: 'leave',
    }

    // 1. Test VineJS leaveValidator
    const validatedData = await LeavesController.leaveValidator.validate(rawPayload)
    assert.equal(validatedData.durationType, 'half_day')
    assert.equal(validatedData.halfDaySession, 'first_half')
    assert.equal(validatedData.requestKind, 'leave')

    // 2. Create parent entities via direct DB inserts
    const [orgId] = await db.table('organizations').insert({
      company_name: 'Test Corp HalfDay',
      slug: `test-corp-${Date.now()}`,
      email: `halfday.${Date.now()}@testcorp.com`,
      is_active: true,
      user_limit: 50,
      timezone: 'Asia/Kolkata',
    })

    const [employeeId] = await db.table('employees').insert({
      org_id: orgId,
      first_name: 'HalfDay',
      last_name: 'User',
      email: `halfday.user.${Date.now()}@testcorp.com`,
      status: 'active',
    })

    const [leaveTypeId] = await db.table('leave_types').insert({
      org_id: orgId,
      type_name: 'Casual Leave Test',
      days_allowed: 12,
      carry_forward: false,
      max_carry_days: 0,
      is_paid: true,
      requires_doc: false,
    })

    // 3. Persist to leaves database table
    const leave = await Leave.create({
      employeeId: Number(employeeId),
      orgId: Number(orgId),
      leaveTypeId: Number(leaveTypeId),
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      reason: validatedData.reason,
      durationType: validatedData.durationType,
      halfDaySession: validatedData.halfDaySession,
      status: 'pending',
    })

    assert.exists(leave.id)
    assert.equal(leave.durationType, 'half_day')
    assert.equal(leave.halfDaySession, 'first_half')

    // 4. Query raw database row from leaves table
    const rawDbRow = await db.from('leaves').where('id', leave.id).first()
    assert.equal(rawDbRow.duration_type, 'half_day')
    assert.equal(rawDbRow.half_day_session, 'first_half')

    // 5. Print serialized JSON output (as returned by HTTP GET /api/leaves response)
    console.log('=== SERIALIZED LEAVE JSON RESPONSE ===')
    console.log(JSON.stringify(leave.serialize(), null, 2))
    console.log('=======================================')
  })

  test('fetches authentic HTTP GET /api/leaves and GET /api/payroll JSON responses over API client', async ({ client, assert }) => {
    const { tenantA } = await setupTestTenants()

    // 1. Create a Leave Type for Tenant A
    const [leaveTypeId] = await db.table('leave_types').insert({
      org_id: tenantA.org.id,
      type_name: 'Sick Leave HTTP Test',
      days_allowed: 10,
      carry_forward: false,
      max_carry_days: 0,
      is_paid: true,
      requires_doc: false,
    })

    // 2. Create a half-day Leave record for admin
    const leave = await Leave.create({
      employeeId: tenantA.admin.id,
      orgId: tenantA.org.id,
      leaveTypeId: Number(leaveTypeId),
      startDate: '2026-10-15',
      endDate: '2026-10-15',
      reason: 'HTTP Test Half Day',
      durationType: 'half_day',
      halfDaySession: 'second_half',
      status: 'pending',
    })

    // 3. Create a Payroll record for Tenant A
    const payroll = await Payroll.create({
      employeeId: tenantA.admin.id,
      orgId: tenantA.org.id,
      month: 10,
      year: 2026,
      basicSalary: 45000,
      hra: 18000,
      allowances: 7000,
      bonus: 2000,
      pfDeduction: 1800,
      esiDeduction: 0,
      tdsDeduction: 2500,
      otherDeductions: 500,
      status: 'processed',
      isLocked: false,
    })

    // 4. Hit HTTP GET /api/leaves as admin user
    const leavesResponse = await client.get('/api/leaves').loginAs(tenantA.admin)
    leavesResponse.assertStatus(200)

    console.log('=== HTTP GET /api/leaves REAL RESPONSE PAYLOAD ===')
    console.log(JSON.stringify(leavesResponse.body(), null, 2))
    console.log('==================================================')

    // 5. Hit HTTP GET /api/payroll as admin user
    const payrollResponse = await client.get('/api/payroll').loginAs(tenantA.admin)
    payrollResponse.assertStatus(200)

    console.log('=== HTTP GET /api/payroll REAL RESPONSE PAYLOAD ===')
    console.log(JSON.stringify(payrollResponse.body(), null, 2))
    console.log('===================================================')

    const leavesData = leavesResponse.body().data
    assert.isArray(leavesData)
    assert.isAbove(leavesData.length, 0)

    const targetLeave = leavesData.find((l: any) => l.id === leave.id)
    assert.exists(targetLeave)
    assert.equal(targetLeave.durationType, 'half_day')
    assert.equal(targetLeave.halfDaySession, 'second_half')
    assert.equal(targetLeave.startDate, '2026-10-15')
    // Confirm camelCase key structure
    assert.isUndefined(targetLeave.duration_type)
    assert.isUndefined(targetLeave.half_day_session)
    assert.isUndefined(targetLeave.start_date)

    const payrollData = payrollResponse.body().data
    assert.isArray(payrollData)
    assert.isAbove(payrollData.length, 0)

    const targetPayroll = payrollData.find((p: any) => p.id === payroll.id)
    assert.exists(targetPayroll)
    assert.equal(targetPayroll.basicSalary, 45000)
    assert.isDefined(targetPayroll.netSalary)
    // Confirm camelCase key structure
    assert.isUndefined(targetPayroll.basic_salary)
    assert.isUndefined(targetPayroll.net_salary)
  })
})
