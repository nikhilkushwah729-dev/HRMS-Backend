import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import AttendanceService from '#services/AttendanceService'
import RegularizationService from '#services/RegularizationService'
import Shift from '#models/shift'
import Attendance from '#models/attendance'
import Payroll from '#models/payroll'
import FaceEmbedding from '#models/face_embedding'
import FaceRecognitionController from '#controllers/Http/FaceRecognitionController'
import RegularizationsController from '#controllers/Http/RegularizationsController'
import AuthorizationService from '#services/AuthorizationService'
import AttendanceRegularization from '#models/attendance_regularization'
import WidenAttendanceRegularizationType from '#database/migrations/1780000022000_widen_attendance_regularization_type'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

test.group('Attendance Module Final Verification', (group) => {
  let attendanceService: AttendanceService
  let regularizationService: RegularizationService

  group.each.setup(async () => {
    attendanceService = new AttendanceService()
    regularizationService = new RegularizationService()
  })

  test('Employee check-in resolves shift, calculates late status, and prevents duplicates', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()

    // 1. Create a morning shift: 09:00 with 15 min grace time
    const shift = await Shift.create({
      orgId: tenantA.org.id,
      name: 'General Day Shift',
      startTime: '09:00:00',
      endTime: '18:00:00',
      graceTime: 15,
      isActive: true,
    })

    // 2. Perform check-in
    const attendance = await attendanceService.checkIn(tenantA.employee.id, tenantA.org.id, {
      source: 'web',
      latitude: 19.0760,
      longitude: 72.8777,
    })

    assert.isNotNull(attendance)
    assert.equal(attendance.employeeId, tenantA.employee.id)
    assert.equal(attendance.orgId, tenantA.org.id)
    assert.equal(attendance.shiftId, shift.id)
    assert.isNotNull(attendance.checkIn)
    assert.isFalse(Boolean(attendance.checkOut))

    // 3. Duplicate punch prevention: attempt check-in again for the same day
    let duplicateError: any = null
    try {
      await attendanceService.checkIn(tenantA.employee.id, tenantA.org.id, { source: 'web' })
    } catch (err) {
      duplicateError = err
    }
    assert.isNotNull(duplicateError)
    assert.include(duplicateError.message, 'Already checked in')

    // 4. Perform check-out
    const clockedOut = await attendanceService.checkOut(tenantA.employee.id, {
      source: 'web',
      latitude: 19.0760,
      longitude: 72.8777,
    })

    assert.isNotNull(clockedOut.checkOut)
    assert.isNumber(clockedOut.workHours)

    // 5. Checking in again after completing shift for today must be rejected
    let postCompleteError: any = null
    try {
      await attendanceService.checkIn(tenantA.employee.id, tenantA.org.id, { source: 'web' })
    } catch (err) {
      postCompleteError = err
    }
    assert.isNotNull(postCompleteError)
    assert.include(postCompleteError.message, 'already completed')
  })

  test('Overnight shift check-out finds yesterday session and calculates correct duration', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const yesterday = DateTime.now().minus({ days: 1 })
    const yesterdayDateStr = yesterday.toISODate()!

    // Create an active check-in from yesterday at 21:00 without checkout
    const overnightCheckInTime = DateTime.fromISO(`${yesterdayDateStr}T21:00:00`)
    const session = await Attendance.create({
      employeeId: tenantA.manager.id,
      orgId: tenantA.org.id,
      attendanceDate: yesterday,
      checkIn: overnightCheckInTime,
      status: 'present',
      isLate: false,
      source: 'web',
    })

    // Employee checks out today (e.g. current morning)
    const checkedOut = await attendanceService.checkOut(tenantA.manager.id, {
      source: 'web',
    })

    assert.equal(checkedOut.id, session.id)
    assert.isNotNull(checkedOut.checkOut)
    assert.isAbove(checkedOut.workHours || 0, 0)
    assert.isAtMost(checkedOut.workHours || 0, 24)
  })

  test('Regularization submission, tenant isolation, approval, and attendance synchronization', async ({ assert }) => {
    const { tenantA, tenantB } = await setupTestTenants()
    const targetDate = DateTime.now().minus({ days: 2 }).toISODate()!

    // 1. Employee submits a regularization request for a missed punch
    const request = await regularizationService.submitRequest(tenantA.employee.id, tenantA.org.id, {
      regularizationDate: targetDate,
      type: 'missed_punch',
      checkIn: '09:30:00',
      checkOut: '18:30:00',
      reason: 'Biometric device network failure at entry gate',
    })

    assert.equal(request.status, 'pending')
    assert.equal(request.employeeId, tenantA.employee.id)
    assert.equal(request.orgId, tenantA.org.id)

    // 2. Cross-tenant isolation: Tenant B admin cannot process Tenant A request
    let crossTenantError: any = null
    try {
      await regularizationService.processRequest(request.id, tenantB.admin.id, tenantB.org.id, 'approved', 'Cross org test')
    } catch (err) {
      crossTenantError = err
    }
    assert.isNotNull(crossTenantError)
    assert.equal(crossTenantError.status, 404)

    // 3. Authorized Tenant A admin approves the request
    const approved = await regularizationService.processRequest(request.id, tenantA.admin.id, tenantA.org.id, 'approved', 'Verified by manager')
    assert.equal(approved.status, 'approved')
    assert.equal(approved.approvedBy, tenantA.admin.id)
    assert.isNotNull(approved.attendanceId)

    // 4. Verify Attendance record was synchronized with valid DATETIME and calculated hours
    const syncAttendance = await Attendance.find(approved.attendanceId)
    assert.isNotNull(syncAttendance)
    assert.equal(syncAttendance!.employeeId, tenantA.employee.id)
    assert.equal(syncAttendance!.orgId, tenantA.org.id)
    assert.equal(syncAttendance!.status, 'present')
    assert.equal(syncAttendance!.source, 'manual')
    assert.equal(syncAttendance!.workHours, 9)
    assert.equal(syncAttendance!.netWorkHours, 9)
    assert.isFalse(Boolean(syncAttendance!.isHalfDay))
  })

  test('Attendance locking prevents post-payroll changes when payroll is locked or paid', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const pastDate = DateTime.now().minus({ months: 1 })
    const pastDateStr = pastDate.toISODate()!

    // Create a locked payroll record for that month
    await Payroll.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      month: pastDate.month,
      year: pastDate.year,
      basicSalary: 50000,
      totalDeductions: 5000,
      netSalary: 45000,
      status: 'paid',
      isLocked: true,
    })

    // Attempting to submit a regularization request for a locked month must be rejected
    let lockError: any = null
    try {
      await regularizationService.submitRequest(tenantA.employee.id, tenantA.org.id, {
        regularizationDate: pastDateStr,
        type: 'missed_punch',
        checkIn: '09:00',
        checkOut: '18:00',
        reason: 'Attempting change on locked month',
      })
    } catch (err) {
      lockError = err
    }

    assert.isNotNull(lockError)
    assert.include(lockError.message, 'locked because payroll has already been processed or paid')

    // 2. Direct punch lock verification: checkIn blocked if payroll is locked for current period
    const { tenantB } = await setupTestTenants()
    const currentNow = DateTime.now()
    await Payroll.create({
      employeeId: tenantB.admin.id,
      orgId: tenantB.org.id,
      month: currentNow.month,
      year: currentNow.year,
      basicSalary: 60000,
      totalDeductions: 0,
      netSalary: 60000,
      status: 'paid',
      isLocked: true,
    })

    let punchLockError: any = null
    try {
      await attendanceService.checkIn(tenantB.admin.id, tenantB.org.id, { source: 'web' })
    } catch (err) {
      punchLockError = err
    }
    assert.isNotNull(punchLockError)
    assert.include(punchLockError.message, 'locked because payroll has already been processed or paid')

    // Clean up temporary lock so subsequent tests remain unaffected
    await Payroll.query().where('employee_id', tenantB.admin.id).delete()
  })

  test('Break tracking correctly records duration and deducts from net work hours', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()

    // Clock in
    await attendanceService.checkIn(tenantA.hr.id, tenantA.org.id, { source: 'web' })

    // Start break
    const onBreak = await attendanceService.startBreak(tenantA.hr.id, { type: 'lunch' })
    assert.isNotNull(onBreak.breakStart)

    // Cannot start second break before ending current break
    let duplicateBreakError: any = null
    try {
      await attendanceService.startBreak(tenantA.hr.id, { type: 'lunch' })
    } catch (err) {
      duplicateBreakError = err
    }
    assert.isNotNull(duplicateBreakError)
    assert.include(duplicateBreakError.message, 'Already on break')

    // End break
    const breakEnded = await attendanceService.endBreak(tenantA.hr.id)
    assert.isNotNull(breakEnded.breakEnd)
    assert.isNumber(breakEnded.totalBreakMin)

    // Verify today status
    const today = await attendanceService.getTodayAttendance(tenantA.hr.id)
    assert.isTrue(today.is_clocked_in)
    assert.isFalse(today.is_clocked_out)
    assert.isDefined(today.break_time_minutes)
  })

  test('Face recognition 0.70 confidence threshold enforcement and auto-punch', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const faceController = new FaceRecognitionController(attendanceService)

    // Ensure clean state for face test
    await Attendance.query().where('employee_id', tenantA.employee.id).delete()
    await FaceEmbedding.query().where('employee_id', tenantA.employee.id).delete()

    // Reference vector (128-dimensional unit vector sample)
    const registeredVector = new Array(128).fill(0.1)
    await FaceEmbedding.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      embedding: JSON.stringify(registeredVector),
      isActive: true,
    })

    // 1. Low confidence vector (orthogonal/distant, cosine similarity < 0.70)
    const mismatchedVector = new Array(128).fill(-0.1)
    mismatchedVector[0] = 0.9

    // Mock HttpContext for verify
    let lowConfidenceResponseData: any = null
    const mockContextLow: any = {
      auth: { user: tenantA.employee },
      request: {
        input: (key: string) => (key === 'embedding' ? mismatchedVector : null),
        validateUsing: async () => ({
          employeeId: tenantA.employee.id,
          action: 'check_in' as const,
        }),
      },
      response: {
        ok: (data: any) => { lowConfidenceResponseData = data; return data },
        badRequest: (data: any) => { lowConfidenceResponseData = data; return data },
      },
    }

    await faceController.verify(mockContextLow)
    assert.isNotNull(lowConfidenceResponseData)
    assert.isFalse(lowConfidenceResponseData.matched)
    assert.isFalse(lowConfidenceResponseData.success)
    assert.isBelow(lowConfidenceResponseData.similarity, 0.70)

    // Ensure no attendance was recorded on failed face match
    const noAttendance = await Attendance.query()
      .where('employee_id', tenantA.employee.id)
      .where('attendance_date', DateTime.now().toISODate()!)
      .first()
    assert.isNull(noAttendance)

    // 2. High confidence vector (exact match, similarity = 1.0) with action: 'check_in'
    let successResponseData: any = null
    const mockContextMatch: any = {
      auth: { user: tenantA.employee },
      request: {
        input: (key: string) => (key === 'embedding' ? registeredVector : null),
        validateUsing: async () => ({
          employeeId: tenantA.employee.id,
          action: 'check_in' as const,
        }),
      },
      response: {
        ok: (data: any) => { successResponseData = data; return data },
        badRequest: (data: any) => { successResponseData = data; return data },
      },
    }

    await faceController.verify(mockContextMatch)
    assert.isNotNull(successResponseData)
    assert.isTrue(successResponseData.matched)
    assert.isTrue(successResponseData.success)
    assert.isAbove(successResponseData.similarity, 0.95)
    assert.isNotNull(successResponseData.attendance)
    assert.isNotNull(successResponseData.tts)

    // Verify actual attendance was saved in database with source = 'face'
    const faceAttendance = await Attendance.query()
      .where('employee_id', tenantA.employee.id)
      .where('attendance_date', DateTime.now().toISODate()!)
      .first()
    assert.isNotNull(faceAttendance)
    assert.equal(faceAttendance!.source, 'face')
    assert.isNotNull(faceAttendance!.checkIn)

    // 3. Duplicate face punch prevention: attempting check_in again with face match
    let duplicateFaceResponse: any = null
    const mockContextDup: any = {
      auth: { user: tenantA.employee },
      request: {
        input: (key: string) => (key === 'embedding' ? registeredVector : null),
        validateUsing: async () => ({
          employeeId: tenantA.employee.id,
          action: 'check_in' as const,
        }),
      },
      response: {
        ok: (data: any) => { duplicateFaceResponse = data; return data },
        badRequest: (data: any) => { duplicateFaceResponse = data; return data },
      },
    }

    await faceController.verify(mockContextDup)
    assert.isNotNull(duplicateFaceResponse)
    assert.isFalse(duplicateFaceResponse.success)
    assert.include(duplicateFaceResponse.message, 'Already checked in')
  })

  test('Regularization approval preserves late, half-day, and overtime status', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const targetDate = DateTime.now().minus({ days: 3 }).toISODate()!

    // 1. Employee checked in late (isLate: true, status: 'late') and forgot to punch out
    const lateAttendance = await Attendance.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      attendanceDate: DateTime.fromISO(targetDate),
      checkIn: DateTime.fromISO(`${targetDate}T10:15:00`),
      isLate: true,
      status: 'late',
      source: 'web',
    })

    // Employee submits missed_punch regularization for check-out punch
    const missedPunchReq = await regularizationService.submitRequest(tenantA.employee.id, tenantA.org.id, {
      regularizationDate: targetDate,
      type: 'missed_punch',
      checkIn: '10:15:00',
      checkOut: '19:15:00',
      reason: 'Forgot to swipe out at end of shift',
    })

    // Approving missed_punch must NOT erase the morning late status!
    await regularizationService.processRequest(missedPunchReq.id, tenantA.admin.id, tenantA.org.id, 'approved')
    await lateAttendance.refresh()
    assert.isTrue(Boolean(lateAttendance.isLate))
    assert.equal(lateAttendance.status, 'late')

    // 2. Explicit late_arrival request: excusing the lateness
    const lateExcuseReq = await regularizationService.submitRequest(tenantA.employee.id, tenantA.org.id, {
      regularizationDate: targetDate,
      type: 'late_arrival',
      checkIn: '09:00:00',
      checkOut: '19:15:00',
      reason: 'Train delayed due to signal failure, approved by manager',
    })
    await regularizationService.processRequest(lateExcuseReq.id, tenantA.admin.id, tenantA.org.id, 'approved')
    await lateAttendance.refresh()
    assert.isFalse(Boolean(lateAttendance.isLate))
    assert.equal(lateAttendance.status, 'present')

    // 3. Half-day regularization
    const halfDayDate = DateTime.now().minus({ days: 4 }).toISODate()!
    const halfDayReq = await regularizationService.submitRequest(tenantA.employee.id, tenantA.org.id, {
      regularizationDate: halfDayDate,
      type: 'half_day',
      checkIn: '09:00:00',
      checkOut: '13:00:00',
      reason: 'Doctor appointment in the afternoon',
    })
    const approvedHalfDay = await regularizationService.processRequest(halfDayReq.id, tenantA.admin.id, tenantA.org.id, 'approved')
    const halfDayAttendance = await Attendance.find(approvedHalfDay.attendanceId)
    assert.isNotNull(halfDayAttendance)
    assert.equal(halfDayAttendance!.status, 'half_day')
    assert.isTrue(Boolean(halfDayAttendance!.isHalfDay))
  })

  test('Check-out beyond 24 hours caps at 24.0h and records audit note without silent truncation', async ({ assert }) => {
    const { tenantB } = await setupTestTenants()
    const yesterday = DateTime.now().minus({ days: 1 })
    const yesterdayStr = yesterday.toISODate()!

    // Create an unclosed punch from 26 hours ago
    const staleAttendance = await Attendance.create({
      employeeId: tenantB.employee.id,
      orgId: tenantB.org.id,
      attendanceDate: DateTime.fromISO(yesterdayStr),
      checkIn: DateTime.now().minus({ hours: 26 }),
      source: 'web',
      status: 'present',
    })

    const checkedOut = await attendanceService.checkOut(tenantB.employee.id, { source: 'web' })
    assert.equal(checkedOut.id, staleAttendance.id)
    assert.equal(checkedOut.workHours, 24.0)
    assert.isNotNull(checkedOut.notes)
    assert.include(checkedOut.notes!, 'Stale checkout')
  })

  test('Face recognition rejects unauthorized registration, cross-employee spoofing, and invalid vectors', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const faceController = new FaceRecognitionController(attendanceService)

    // 1. Normal employee cannot register face for another employee (403)
    let forbiddenRegisterResponse: any = null
    const mockContextRegOther: any = {
      auth: { user: tenantA.employee }, // roleId: 5 (regular employee)
      request: {
        validateUsing: async () => ({
          employeeId: tenantA.manager.id, // Trying to register face for manager!
          embedding: JSON.stringify(new Array(128).fill(0.2)),
        }),
      },
      response: {
        forbidden: (data: any) => { forbiddenRegisterResponse = data; return data },
        created: (data: any) => data,
      },
    }

    await faceController.register(mockContextRegOther)
    assert.isNotNull(forbiddenRegisterResponse)
    assert.include(forbiddenRegisterResponse.message, 'do not have permission')

    // 2. Vector with < 64 dimensions is rejected (400)
    let invalidVectorResponse: any = null
    const mockContextShortVec: any = {
      auth: { user: tenantA.employee },
      request: {
        input: () => [0.1, 0.2, 0.3], // only 3 dimensions!
        validateUsing: async () => ({ employeeId: tenantA.employee.id }),
      },
      response: {
        badRequest: (data: any) => { invalidVectorResponse = data; return data },
        ok: (data: any) => data,
      },
    }

    await faceController.verify(mockContextShortVec)
    assert.isNotNull(invalidVectorResponse)
    assert.include(invalidVectorResponse.message, 'minimum 64 dimensions')

    // 3. Normal employee cannot punch on behalf of another employee (403)
    let forbiddenPunchResponse: any = null
    const mockContextPunchOther: any = {
      auth: { user: tenantA.employee },
      request: {
        input: () => new Array(128).fill(0.1),
        validateUsing: async () => ({
          employeeId: tenantA.manager.id,
          action: 'check_in' as const,
        }),
      },
      response: {
        forbidden: (data: any) => { forbiddenPunchResponse = data; return data },
        badRequest: (data: any) => data,
        ok: (data: any) => data,
      },
    }

    await faceController.verify(mockContextPunchOther)
    assert.isNotNull(forbiddenPunchResponse)
    assert.include(forbiddenPunchResponse.message, 'cannot perform face verification punches on behalf of other employees')
  })

  test('Security & RBAC: Regular employee cannot approve requests or spy on/mutate other employees face data', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()
    const authService = new AuthorizationService()
    const regController = new RegularizationsController(regularizationService, authService)
    const faceController = new FaceRecognitionController(attendanceService)

    // 1. Regular employee attempts to approve a regularization request (403 Forbidden)
    let forbiddenApprovalResponse: any = null
    const mockContextApprove: any = {
      auth: { user: tenantA.employee }, // roleId: 5 (Employee)
      params: { id: 1 },
      request: {
        validateUsing: async () => ({ status: 'approved' as const }),
      },
      response: {
        forbidden: (data: any) => { forbiddenApprovalResponse = data; return data },
        ok: (data: any) => data,
      },
    }

    await regController.update(mockContextApprove)
    assert.isNotNull(forbiddenApprovalResponse)
    assert.include(forbiddenApprovalResponse.message, 'do not have permission to approve')

    // 2. Regular employee attempts to check another employee's face status (403 Forbidden)
    let forbiddenStatusResponse: any = null
    const mockContextStatus: any = {
      auth: { user: tenantA.employee },
      params: { id: tenantA.manager.id },
      response: {
        forbidden: (data: any) => { forbiddenStatusResponse = data; return data },
        ok: (data: any) => data,
      },
    }

    await faceController.status(mockContextStatus)
    assert.isNotNull(forbiddenStatusResponse)
    assert.include(forbiddenStatusResponse.message, 'do not have permission')

    // 3. Regular employee attempts to delete another employee's face template (403 Forbidden)
    let forbiddenDeleteResponse: any = null
    const mockContextDelete: any = {
      auth: { user: tenantA.employee },
      params: { id: tenantA.manager.id },
      response: {
        forbidden: (data: any) => { forbiddenDeleteResponse = data; return data },
        ok: (data: any) => data,
      },
    }

    await faceController.delete(mockContextDelete)
    assert.isNotNull(forbiddenDeleteResponse)
    assert.include(forbiddenDeleteResponse.message, 'do not have permission')
  })

  test('Migration Rollback & Recovery: non-standard regularization types are safely preserved and recoverable without data loss', async ({ assert }) => {
    const { tenantA } = await setupTestTenants()

    // 1. Insert records across all types and edge cases:
    // Case A: early_departure with reason containing pre-existing brackets
    const recordEarlyWithBrackets = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now(),
      type: 'early_departure',
      reason: '[Urgent] Family emergency: child doctor visit',
      status: 'pending',
    })

    // Case B: overtime with quotes, semicolons, and punctuation
    const recordOTWithPunctuation = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now().minus({ days: 1 }),
      type: 'overtime',
      reason: 'Server upgrade "Release 2.4.0"; on-call triage & DB indexing',
      status: 'pending',
    })

    // Case C: custom extended type
    const recordCustomType = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now().minus({ days: 2 }),
      type: 'remote_site_visit',
      reason: 'Client client-side inspection at Mumbai data center',
      status: 'pending',
    })

    // Case D: All 4 standard types (must remain completely untouched)
    const recordMissedPunch = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now().minus({ days: 3 }),
      type: 'missed_punch',
      reason: 'Biometric fingerprint scanner not recognizing thumb',
      status: 'pending',
    })

    const recordLateArrival = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now().minus({ days: 4 }),
      type: 'late_arrival',
      reason: 'Metro train delay between stations [Line 1]',
      status: 'pending',
    })

    const recordHalfDay = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now().minus({ days: 5 }),
      type: 'half_day',
      reason: 'Personal work in second half',
      status: 'pending',
    })

    const recordOther = await AttendanceRegularization.create({
      employeeId: tenantA.employee.id,
      orgId: tenantA.org.id,
      regularizationDate: DateTime.now().minus({ days: 6 }),
      type: 'other',
      reason: 'Special company event participation',
      status: 'pending',
    })

    // 2. Execute the migration's actual down() implementation
    const migration = new WidenAttendanceRegularizationType(db.connection(), '1780000022000_widen_attendance_regularization_type.ts')
    await migration.down()

    // 3. Verify that non-standard records are safely remapped to 'other' with prefix in reason
    await recordEarlyWithBrackets.refresh()
    await recordOTWithPunctuation.refresh()
    await recordCustomType.refresh()
    await recordMissedPunch.refresh()
    await recordLateArrival.refresh()
    await recordHalfDay.refresh()
    await recordOther.refresh()

    // Non-standard types remapped to 'other' with precise prefix
    assert.equal(recordEarlyWithBrackets.type, 'other')
    assert.equal(recordEarlyWithBrackets.reason, '[Type Reverted from: early_departure] [Urgent] Family emergency: child doctor visit')

    assert.equal(recordOTWithPunctuation.type, 'other')
    assert.equal(recordOTWithPunctuation.reason, '[Type Reverted from: overtime] Server upgrade "Release 2.4.0"; on-call triage & DB indexing')

    assert.equal(recordCustomType.type, 'other')
    assert.equal(recordCustomType.reason, '[Type Reverted from: remote_site_visit] Client client-side inspection at Mumbai data center')

    // Standard records must be 100% UNMODIFIED
    assert.equal(recordMissedPunch.type, 'missed_punch')
    assert.equal(recordMissedPunch.reason, 'Biometric fingerprint scanner not recognizing thumb')

    assert.equal(recordLateArrival.type, 'late_arrival')
    assert.equal(recordLateArrival.reason, 'Metro train delay between stations [Line 1]')

    assert.equal(recordHalfDay.type, 'half_day')
    assert.equal(recordHalfDay.reason, 'Personal work in second half')

    assert.equal(recordOther.type, 'other')
    assert.equal(recordOther.reason, 'Special company event participation')

    // 4. Test recovery procedure: first re-apply migration.up() to widen the column back to VARCHAR(50)
    await migration.up()

    // 5. Run the recovery query to parse the preserved type back and strip the reason prefix
    await db.rawQuery(
      `UPDATE attendance_regularizations 
       SET "type" = SUBSTR(reason, 22, INSTR(reason, ']') - 22),
           reason = SUBSTR(reason, INSTR(reason, ']') + 2)
       WHERE reason LIKE '%Type Reverted from:%'`
    )

    await recordEarlyWithBrackets.refresh()
    await recordOTWithPunctuation.refresh()
    await recordCustomType.refresh()

    // Verify 100% round-trip fidelity:
    assert.equal(recordEarlyWithBrackets.type, 'early_departure')
    assert.equal(recordEarlyWithBrackets.reason, '[Urgent] Family emergency: child doctor visit')

    assert.equal(recordOTWithPunctuation.type, 'overtime')
    assert.equal(recordOTWithPunctuation.reason, 'Server upgrade "Release 2.4.0"; on-call triage & DB indexing')

    assert.equal(recordCustomType.type, 'remote_site_visit')
    assert.equal(recordCustomType.reason, 'Client client-side inspection at Mumbai data center')
  })
})


