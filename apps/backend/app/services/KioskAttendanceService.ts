import crypto from 'node:crypto'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import AttendanceService from '#services/AttendanceService'
import AuditLogService from '#services/AuditLogService'
import Employee from '#models/employee'
import Kiosk from '#models/kiosk'
import AttendanceLog from '#models/attendance_log'
import EmployeeFaceProfile from '#models/employee_face_profile'
import FaceEmbedding from '#models/face_embedding'

export type KioskAttendanceMethod = 'face' | 'pin' | 'qr'
export type KioskAttendanceType = 'check_in' | 'check_out'

@inject()
export default class KioskAttendanceService {
  constructor(
    protected attendanceService: AttendanceService,
    protected auditLogService: AuditLogService,
  ) {}

  async registerKiosk(
    payload: {
      orgId: number
      orgLocationId?: number | null
      name: string
      location: string
      deviceId: string
      registeredBy?: number | null
    },
    ctx?: HttpContext,
  ) {
    const existing = await Kiosk.query().where('device_id', payload.deviceId).first()

    if (existing) {
      existing.name = payload.name
      existing.location = payload.location
      existing.orgId = payload.orgId
      existing.orgLocationId = payload.orgLocationId ?? existing.orgLocationId
      existing.registeredBy = payload.registeredBy ?? existing.registeredBy
      existing.status = existing.status
      await existing.save()
      return existing
    }

    const kiosk = await Kiosk.create({
      orgId: payload.orgId,
      orgLocationId: payload.orgLocationId ?? null,
      name: payload.name,
      location: payload.location,
      deviceId: payload.deviceId,
      status: 'pending',
      registeredBy: payload.registeredBy ?? null,
    })

    await this.auditLogService.log({
      orgId: kiosk.orgId,
      employeeId: payload.registeredBy ?? undefined,
      action: 'kiosk_registered',
      module: 'kiosk',
      entityName: 'kiosk',
      entityId: kiosk.id,
      newValues: kiosk.toJSON(),
      ctx,
    })

    return kiosk
  }

  async approveKiosk(kiosk: Kiosk, approverId: number, orgLocationId?: number | null, ctx?: HttpContext) {
    const oldValues = kiosk.toJSON()
    kiosk.status = 'active'
    kiosk.deviceToken = this.generateDeviceToken()
    kiosk.approvedBy = approverId
    kiosk.approvedAt = DateTime.now()
    if (orgLocationId !== undefined) {
      kiosk.orgLocationId = orgLocationId
    }
    await kiosk.save()

    await this.auditLogService.log({
      orgId: kiosk.orgId,
      employeeId: approverId,
      action: 'kiosk_approved',
      module: 'kiosk',
      entityName: 'kiosk',
      entityId: kiosk.id,
      oldValues,
      newValues: kiosk.toJSON(),
      ctx,
    })

    return kiosk
  }

  async blockKiosk(kiosk: Kiosk, approverId: number, ctx?: HttpContext) {
    const oldValues = kiosk.toJSON()
    kiosk.status = 'blocked'
    await kiosk.save()

    await this.auditLogService.log({
      orgId: kiosk.orgId,
      employeeId: approverId,
      action: 'kiosk_blocked',
      module: 'kiosk',
      entityName: 'kiosk',
      entityId: kiosk.id,
      oldValues,
      newValues: kiosk.toJSON(),
      ctx,
    })

    return kiosk
  }

  async toggleKiosk(kiosk: Kiosk, approverId: number, ctx?: HttpContext) {
    const oldValues = kiosk.toJSON()
    kiosk.status = kiosk.status === 'active' ? 'inactive' : 'active'
    if (kiosk.status === 'active' && !kiosk.deviceToken) {
      kiosk.deviceToken = this.generateDeviceToken()
    }
    await kiosk.save()

    await this.auditLogService.log({
      orgId: kiosk.orgId,
      employeeId: approverId,
      action: 'kiosk_status_changed',
      module: 'kiosk',
      entityName: 'kiosk',
      entityId: kiosk.id,
      oldValues,
      newValues: kiosk.toJSON(),
      ctx,
    })

    return kiosk
  }

  async resetKioskToken(kiosk: Kiosk, approverId: number, ctx?: HttpContext) {
    const oldValues = kiosk.toJSON()
    kiosk.deviceToken = this.generateDeviceToken()
    await kiosk.save()

    await this.auditLogService.log({
      orgId: kiosk.orgId,
      employeeId: approverId,
      action: 'kiosk_token_reset',
      module: 'kiosk',
      entityName: 'kiosk',
      entityId: kiosk.id,
      oldValues,
      newValues: kiosk.toJSON(),
      ctx,
    })

    return kiosk
  }

  async validateKiosk(deviceId: string, deviceToken: string) {
    const kiosk = await Kiosk.query()
      .where('device_id', deviceId)
      .where('device_token', deviceToken)
      .first()

    if (!kiosk) {
      throw new Exception('Device not authorized', { status: 401 })
    }

    if (kiosk.status !== 'active') {
      throw new Exception('Kiosk is not active', { status: 403 })
    }

    kiosk.lastSeenAt = DateTime.now()
    await kiosk.save()

    return kiosk
  }

  async submitPinAttendance(
    kiosk: Kiosk,
    payload: { employeeCode: string; pin: string; type?: KioskAttendanceType; clientReference?: string },
    ctx?: HttpContext,
  ) {
    const employee = await Employee.query()
      .where('org_id', kiosk.orgId)
      .where('employee_code', payload.employeeCode)
      .first()

    if (!employee) {
      await this.recordFailedAttempt(kiosk, 'pin', payload.type ?? 'check_in', payload.clientReference, 'Employee not found', ctx)
      throw new Exception('Employee not found', { status: 404 })
    }

    await this.ensureEmployeeEligible(employee, kiosk)
    await this.ensurePinAllowed(employee)

    const verified = employee.kioskPinHash ? await hash.verify(employee.kioskPinHash, payload.pin) : false

    if (!verified) {
      await this.registerPinFailure(employee)
      await this.recordFailedAttempt(kiosk, 'pin', payload.type ?? 'check_in', payload.clientReference, 'Invalid kiosk PIN', ctx, employee.id)
      throw new Exception('Invalid employee ID or PIN', { status: 400 })
    }

    await this.resetPinFailures(employee)
    return this.markAttendance(employee, kiosk, 'pin', payload.type, payload.clientReference, null, ctx)
  }

  async submitFaceAttendance(
    kiosk: Kiosk,
    payload: {
      embedding: number[]
      imageUrl?: string
      type?: KioskAttendanceType
      clientReference?: string
      liveness?: { confirmed?: boolean; blinkDetected?: boolean; headMovementDetected?: boolean }
    },
    ctx?: HttpContext,
  ) {
    if (!this.passesLiveness(payload.liveness)) {
      await this.recordFailedAttempt(
        kiosk,
        'face',
        payload.type ?? 'check_in',
        payload.clientReference,
        'Liveness check failed',
        ctx,
        undefined,
        payload.imageUrl,
        'suspicious',
      )
      throw new Exception('Liveness check failed. Please blink or move slightly and try again.', { status: 400 })
    }

    const match = await this.findBestFaceMatch(kiosk.orgId, payload.embedding)
    if (!match) {
      await this.recordFailedAttempt(
        kiosk,
        'face',
        payload.type ?? 'check_in',
        payload.clientReference,
        'Face not recognized',
        ctx,
        undefined,
        payload.imageUrl,
        'failed',
      )
      throw new Exception('Face not recognized', { status: 404 })
    }

    await this.ensureEmployeeEligible(match.employee, kiosk)
    return this.markAttendance(match.employee, kiosk, 'face', payload.type, payload.clientReference, payload.imageUrl ?? null, ctx)
  }

  async submitQrAttendance(
    kiosk: Kiosk,
    payload: { qrToken: string; type?: KioskAttendanceType; clientReference?: string },
    ctx?: HttpContext,
  ) {
    const parsed = this.parseQrToken(payload.qrToken)
    if (!parsed) {
      await this.recordFailedAttempt(kiosk, 'qr', payload.type ?? 'check_in', payload.clientReference, 'QR token invalid or expired', ctx)
      throw new Exception('QR token invalid or expired', { status: 400 })
    }

    const employee = await Employee.query()
      .where('org_id', kiosk.orgId)
      .where('employee_code', parsed.employeeCode)
      .first()

    if (!employee) {
      await this.recordFailedAttempt(kiosk, 'qr', payload.type ?? 'check_in', payload.clientReference, 'Employee not found for QR token', ctx)
      throw new Exception('Employee not found', { status: 404 })
    }

    await this.ensureEmployeeEligible(employee, kiosk)
    return this.markAttendance(employee, kiosk, 'qr', payload.type, payload.clientReference, null, ctx)
  }

  async syncOffline(kiosk: Kiosk, records: Array<Record<string, any>>, ctx?: HttpContext) {
    const results: Array<Record<string, any>> = []

    for (const record of records) {
      const clientReference = String(record.clientReference || '').trim()
      if (!clientReference) {
        results.push({ clientReference: null, success: false, message: 'clientReference is required' })
        continue
      }

      const existing = await AttendanceLog.query()
        .where('kiosk_id', kiosk.id)
        .where('client_reference', clientReference)
        .first()

      if (existing) {
        results.push({ clientReference, success: true, duplicated: true, logId: existing.id })
        continue
      }

      try {
        if (record.method === 'face') {
          const result = await this.submitFaceAttendance(
            kiosk,
            {
              embedding: Array.isArray(record.embedding) ? record.embedding : [],
              imageUrl: record.imageUrl,
              type: record.type,
              clientReference,
              liveness: record.liveness,
            },
            ctx,
          )
          results.push({ clientReference, success: true, result })
          continue
        }

        if (record.method === 'pin') {
          const result = await this.submitPinAttendance(
            kiosk,
            {
              employeeCode: String(record.employeeCode || ''),
              pin: String(record.pin || ''),
              type: record.type,
              clientReference,
            },
            ctx,
          )
          results.push({ clientReference, success: true, result })
          continue
        }

        if (record.method === 'qr') {
          const result = await this.submitQrAttendance(
            kiosk,
            {
              qrToken: String(record.qrToken || ''),
              type: record.type,
              clientReference,
            },
            ctx,
          )
          results.push({ clientReference, success: true, result })
          continue
        }

        results.push({ clientReference, success: false, message: 'Unsupported sync method' })
      } catch (error: any) {
        results.push({ clientReference, success: false, message: error?.message || 'Sync failed' })
      }
    }

    return results
  }

  async upsertFaceProfile(
    payload: {
      orgId: number
      employeeId: number
      embedding: number[]
      referenceImageUrl?: string
      createdBy?: number | null
    },
    ctx?: HttpContext,
  ) {
    const existing = await EmployeeFaceProfile.query()
      .where('org_id', payload.orgId)
      .where('employee_id', payload.employeeId)
      .orderBy('id', 'desc')
      .first()

    const profile = existing ?? new EmployeeFaceProfile()
    profile.orgId = payload.orgId
    profile.employeeId = payload.employeeId
    profile.faceEmbedding = JSON.stringify(payload.embedding)
    profile.referenceImageUrl = payload.referenceImageUrl ?? profile.referenceImageUrl ?? null
    profile.status = 'pending'
    profile.createdBy = payload.createdBy ?? profile.createdBy ?? payload.employeeId
    profile.approvedBy = null
    profile.approvedAt = null
    await profile.save()

    await this.auditLogService.log({
      orgId: payload.orgId,
      employeeId: payload.createdBy ?? payload.employeeId,
      action: 'face_profile_submitted',
      module: 'kiosk',
      entityName: 'employee_face_profile',
      entityId: profile.id,
      newValues: profile.toJSON(),
      ctx,
    })

    return profile
  }

  async approveFaceProfile(profile: EmployeeFaceProfile, approverId: number, ctx?: HttpContext) {
    const oldValues = profile.toJSON()

    await EmployeeFaceProfile.query()
      .where('org_id', profile.orgId)
      .where('employee_id', profile.employeeId)
      .whereNot('id', profile.id)
      .where('status', 'active')
      .update({ status: 'inactive', updated_at: new Date() })

    profile.status = 'active'
    profile.approvedBy = approverId
    profile.approvedAt = DateTime.now()
    await profile.save()

    await this.auditLogService.log({
      orgId: profile.orgId,
      employeeId: approverId,
      action: 'face_profile_approved',
      module: 'kiosk',
      entityName: 'employee_face_profile',
      entityId: profile.id,
      oldValues,
      newValues: profile.toJSON(),
      ctx,
    })

    return profile
  }

  async rejectFaceProfile(profile: EmployeeFaceProfile, approverId: number, ctx?: HttpContext) {
    const oldValues = profile.toJSON()
    profile.status = 'rejected'
    profile.approvedBy = approverId
    profile.approvedAt = DateTime.now()
    await profile.save()

    await this.auditLogService.log({
      orgId: profile.orgId,
      employeeId: approverId,
      action: 'face_profile_rejected',
      module: 'kiosk',
      entityName: 'employee_face_profile',
      entityId: profile.id,
      oldValues,
      newValues: profile.toJSON(),
      ctx,
    })

    return profile
  }

  generateEmployeeQrToken(employeeCode: string, expiresInMinutes = 2) {
    const expiresAt = DateTime.now().plus({ minutes: expiresInMinutes }).toUTC().toISO()
    if (!expiresAt) {
      throw new Exception('QR token expiry could not be generated', { status: 500 })
    }

    const payload = Buffer.from(
      JSON.stringify({ employeeCode, expiresAt }),
      'utf8',
    ).toString('base64url')
    const secret = env.get('APP_KEY').release()
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

    return {
      token: payload + '.' + signature,
      expiresAt,
    }
  }

  async getAttendanceLogs(orgId: number, filters: Record<string, any>) {
    const page = Math.max(1, Number(filters.page || 1))
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)))
    const query = AttendanceLog.query()
      .where('org_id', orgId)
      .preload('employee')
      .preload('kiosk')
      .orderBy('timestamp', 'desc')

    if (filters.status) {
      query.where('status', String(filters.status))
    }

    if (filters.method) {
      query.where('method', String(filters.method))
    }

    if (filters.employeeId) {
      query.where('employee_id', Number(filters.employeeId))
    }

    if (filters.kioskId) {
      query.where('kiosk_id', Number(filters.kioskId))
    }

    if (filters.startDate && filters.endDate) {
      query.whereBetween('attendance_date', [String(filters.startDate), String(filters.endDate)])
    }

    return query.paginate(page, limit)
  }

  private async markAttendance(
    employee: Employee,
    kiosk: Kiosk,
    method: KioskAttendanceMethod,
    requestedType: KioskAttendanceType | undefined,
    clientReference: string | undefined,
    imageUrl: string | null,
    ctx?: HttpContext,
  ) {
    const shift = await this.resolveShift(employee.id, employee.orgId)
    const action = await this.resolveAttendanceAction(employee.id, requestedType)

    const deviceInfo = JSON.stringify({
      source: 'kiosk',
      kioskId: kiosk.id,
      kioskName: kiosk.name,
      deviceId: kiosk.deviceId,
      method,
    })

    let attendance: any
    if (action === 'check_in') {
      attendance = await this.attendanceService.checkIn(employee.id, employee.orgId, {
        shiftId: shift?.id ?? null,
        source: 'kiosk',
        deviceInfo,
        selfieUrl: imageUrl ?? undefined,
      })
    } else {
      attendance = await this.attendanceService.checkOut(employee.id, {
        shiftId: shift?.id ?? null,
        source: 'kiosk',
        deviceInfo,
        selfieUrl: imageUrl ?? undefined,
      })
    }

    const metrics = this.calculateShiftMetrics(action, attendance, shift)
    const log = await AttendanceLog.create({
      orgId: employee.orgId,
      employeeId: employee.id,
      kioskId: kiosk.id,
      attendanceDate: DateTime.now(),
      type: action,
      method,
      timestamp: DateTime.now(),
      shiftId: shift?.id ?? null,
      status: 'success',
      lateMinutes: metrics.lateMinutes,
      earlyExitMinutes: metrics.earlyExitMinutes,
      overtimeMinutes: metrics.overtimeMinutes,
      ipAddress: this.getClientIp(ctx),
      deviceId: kiosk.deviceId,
      clientReference: clientReference ?? null,
      imageUrl,
      failureReason: null,
    })

    await this.auditLogService.log({
      orgId: employee.orgId,
      employeeId: employee.id,
      action: 'kiosk_attendance_marked',
      module: 'kiosk',
      entityName: 'attendance_log',
      entityId: log.id,
      newValues: log.toJSON(),
      ctx,
    })

    return {
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.fullName,
      },
      kiosk: {
        id: kiosk.id,
        name: kiosk.name,
        location: kiosk.location,
      },
      attendance: {
        id: attendance.id,
        type: action,
        status: attendance.status,
        method,
        timestamp: DateTime.now().toISO(),
        lateMinutes: metrics.lateMinutes,
        earlyExitMinutes: metrics.earlyExitMinutes,
        overtimeMinutes: metrics.overtimeMinutes,
      },
      message: action === 'check_in' ? 'Attendance marked successfully' : 'Check-out marked successfully',
    }
  }

  private async resolveAttendanceAction(employeeId: number, requestedType?: KioskAttendanceType) {
    const openAttendance = await db
      .from('attendances')
      .where('employee_id', employeeId)
      .where('attendance_date', DateTime.now().toISODate()!)
      .whereNull('check_out')
      .first()

    if (requestedType === 'check_in' && openAttendance) {
      throw new Exception('Already checked in', { status: 400 })
    }

    if (requestedType === 'check_out' && !openAttendance) {
      throw new Exception('Check-in required before check-out', { status: 400 })
    }

    if (requestedType) {
      return requestedType
    }

    return openAttendance ? 'check_out' : 'check_in'
  }

  private async resolveShift(employeeId: number, orgId: number) {
    const today = DateTime.now().toISODate()!

    const assignedShift = await db
      .from('employee_shifts as es')
      .join('shifts as s', 's.id', 'es.shift_id')
      .where('es.employee_id', employeeId)
      .where('es.effective_from', '<=', today)
      .where((builder) => {
        builder.whereNull('es.effective_to').orWhere('es.effective_to', '>=', today)
      })
      .where('s.is_active', true)
      .select(
        's.id',
        db.raw('s.shift_name as name'),
        's.start_time',
        's.end_time',
        db.raw('s.grace_minutes as grace_time'),
      )
      .first()

    if (assignedShift) {
      return assignedShift
    }

    return db
      .from('shifts')
      .where('org_id', orgId)
      .where('is_active', true)
      .select(
        'id',
        db.raw('shift_name as name'),
        'start_time',
        'end_time',
        db.raw('grace_minutes as grace_time'),
      )
      .orderBy('id', 'asc')
      .first()
  }

  private calculateExpectedShiftMinutes(shift: any) {
    const start = String(shift?.start_time || '')
    const end = String(shift?.end_time || '')

    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)

    if ([startHour, startMinute, endHour, endMinute].some((value) => Number.isNaN(value))) {
      return 8 * 60
    }

    let startTotal = (startHour || 0) * 60 + (startMinute || 0)
    let endTotal = (endHour || 0) * 60 + (endMinute || 0)
    if (endTotal <= startTotal) {
      endTotal += 24 * 60
    }

    return Math.max(0, endTotal - startTotal) || 8 * 60
  }

  private calculateShiftMetrics(action: KioskAttendanceType, attendance: any, shift: any) {
    const metrics = {
      lateMinutes: 0,
      earlyExitMinutes: 0,
      overtimeMinutes: 0,
    }

    if (!shift) {
      return metrics
    }

    const now = DateTime.now()
    if (action === 'check_in' && shift.start_time) {
      const [startHour, startMinute] = String(shift.start_time).split(':').map(Number)
      const grace = Number(shift.grace_time || 0)
      const shiftStart = now.set({ hour: startHour || 0, minute: startMinute || 0, second: 0, millisecond: 0 }).plus({ minutes: grace })
      if (now > shiftStart) {
        metrics.lateMinutes = Math.max(0, Math.round(now.diff(shiftStart, 'minutes').minutes || 0))
      }
    }

    if (action === 'check_out' && shift.end_time) {
      const [endHour, endMinute] = String(shift.end_time).split(':').map(Number)
      const shiftEnd = now.set({ hour: endHour || 0, minute: endMinute || 0, second: 0, millisecond: 0 })
      if (now < shiftEnd) {
        metrics.earlyExitMinutes = Math.max(0, Math.round(shiftEnd.diff(now, 'minutes').minutes || 0))
      }
      if (attendance?.workHours) {
        const expectedMinutes = this.calculateExpectedShiftMinutes(shift)
        const workedMinutes = Math.round(Number(attendance.workHours) * 60)
        metrics.overtimeMinutes = Math.max(0, workedMinutes - expectedMinutes)
      }
    }

    return metrics
  }

  private async ensureEmployeeEligible(employee: Employee, kiosk: Kiosk) {
    if (employee.orgId !== kiosk.orgId) {
      throw new Exception('Cross organization attendance is not allowed', { status: 403 })
    }

    if (employee.status !== 'active') {
      throw new Exception('Employee is not active', { status: 403 })
    }

    if (kiosk.orgLocationId && employee.geofenceId && kiosk.orgLocationId !== employee.geofenceId) {
      throw new Exception('Employee is not assigned to this kiosk location', { status: 403 })
    }
  }

  private async ensurePinAllowed(employee: Employee) {
    if (!employee.kioskPinHash) {
      throw new Exception('Kiosk PIN is not configured for this employee', { status: 400 })
    }

    if (employee.kioskPinBlockedUntil && employee.kioskPinBlockedUntil > DateTime.now()) {
      throw new Exception('PIN is temporarily blocked due to repeated failures', { status: 429 })
    }
  }

  private async registerPinFailure(employee: Employee) {
    const attempts = Number(employee.kioskPinAttempts || 0) + 1
    employee.kioskPinAttempts = attempts
    if (attempts >= 5) {
      employee.kioskPinBlockedUntil = DateTime.now().plus({ minutes: 15 })
      employee.kioskPinAttempts = 0
    }
    await employee.save()
  }

  private async resetPinFailures(employee: Employee) {
    employee.kioskPinAttempts = 0
    employee.kioskPinBlockedUntil = null
    await employee.save()
  }

  private async findBestFaceMatch(orgId: number, embedding: number[]) {
    const profiles = await EmployeeFaceProfile.query()
      .where('org_id', orgId)
      .where('status', 'active')
      .preload('employee')

    const fallbackProfiles = profiles.length ? [] : await FaceEmbedding.query().where('org_id', orgId).where('is_active', true).preload('employee')

    let bestEmployee: Employee | null = null
    let bestScore = Number.MAX_SAFE_INTEGER

    for (const profile of profiles) {
      const score = this.euclideanDistance(embedding, profile.getEmbeddingArray())
      if (score < bestScore) {
        bestScore = score
        bestEmployee = profile.employee
      }
    }

    for (const profile of fallbackProfiles) {
      const score = this.euclideanDistance(embedding, profile.getEmbeddingArray())
      if (score < bestScore) {
        bestScore = score
        bestEmployee = profile.employee
      }
    }

    if (!bestEmployee || bestScore > 0.6) {
      return null
    }

    return {
      employee: bestEmployee,
      score: bestScore,
    }
  }

  private euclideanDistance(left: number[], right: number[]) {
    if (!left.length || !right.length || left.length !== right.length) {
      return Number.MAX_SAFE_INTEGER
    }

    let total = 0
    for (let index = 0; index < left.length; index += 1) {
      const delta = (left[index] || 0) - (right[index] || 0)
      total += delta * delta
    }

    return Math.sqrt(total)
  }

  private passesLiveness(liveness?: { confirmed?: boolean; blinkDetected?: boolean; headMovementDetected?: boolean }) {
    if (!liveness) {
      return false
    }

    if (liveness.confirmed === true) {
      return true
    }

    return Boolean(liveness.blinkDetected || liveness.headMovementDetected)
  }

  private parseQrToken(token: string) {
    const trimmedToken = String(token || '').trim()
    if (!trimmedToken) {
      return null
    }

    const secret = env.get('APP_KEY').release()

    try {
      const separatorIndex = trimmedToken.lastIndexOf('.')
      if (separatorIndex > 0) {
        const payload = trimmedToken.slice(0, separatorIndex)
        const signature = trimmedToken.slice(separatorIndex + 1)
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')

        if (signature === expected) {
          const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
            employeeCode?: string
            expiresAt?: string
          }

          const employeeCode = String(decoded.employeeCode || '').trim()
          const expiry = DateTime.fromISO(String(decoded.expiresAt || ''))
          if (employeeCode && expiry.isValid && expiry >= DateTime.now()) {
            return { employeeCode }
          }
        }
      }
    } catch {
      // Fall back to legacy token parsing below.
    }

    try {
      const parts = trimmedToken.split('.')
      if (parts.length < 3) {
        return null
      }

      const employeeCode = parts[0]
      const signature = parts[parts.length - 1]
      const expiresAt = parts.slice(1, -1).join('.')
      if (!employeeCode || !expiresAt || !signature) {
        return null
      }

      const payload = `${employeeCode}.${expiresAt}`
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
      if (signature !== expected) {
        return null
      }

      const expiry = DateTime.fromISO(expiresAt)
      if (!expiry.isValid || expiry < DateTime.now()) {
        return null
      }

      return { employeeCode }
    } catch {
      return null
    }
  }

  private async recordFailedAttempt(
    kiosk: Kiosk,
    method: KioskAttendanceMethod,
    type: KioskAttendanceType,
    clientReference: string | undefined,
    reason: string,
    ctx?: HttpContext,
    employeeId?: number,
    imageUrl?: string,
    status: 'failed' | 'suspicious' = 'failed',
  ) {
    const existing = clientReference
      ? await AttendanceLog.query().where('kiosk_id', kiosk.id).where('client_reference', clientReference).first()
      : null

    if (existing) {
      return existing
    }

    const log = await AttendanceLog.create({
      orgId: kiosk.orgId,
      employeeId: employeeId ?? null,
      kioskId: kiosk.id,
      attendanceDate: DateTime.now(),
      type,
      method,
      timestamp: DateTime.now(),
      shiftId: null,
      status,
      lateMinutes: 0,
      earlyExitMinutes: 0,
      overtimeMinutes: 0,
      ipAddress: this.getClientIp(ctx),
      deviceId: kiosk.deviceId,
      clientReference: clientReference ?? null,
      imageUrl: imageUrl ?? null,
      failureReason: reason,
    })

    await this.auditLogService.log({
      orgId: kiosk.orgId,
      employeeId,
      action: status === 'suspicious' ? 'kiosk_suspicious_attempt' : 'kiosk_attendance_failed',
      module: 'kiosk',
      entityName: 'attendance_log',
      entityId: log.id,
      newValues: log.toJSON(),
      ctx,
    })

    return log
  }

  private generateDeviceToken() {
    return crypto.randomBytes(24).toString('hex')
  }

  private getClientIp(ctx?: HttpContext) {
    if (!ctx) {
      return null
    }

    const forwardedFor = ctx.request.header('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0]?.trim() || null
    }

    return ctx.request.ip()
  }
}


