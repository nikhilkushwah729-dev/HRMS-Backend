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

  private static isTablesEnsured = false

  public static async ensureTables() {
    if (KioskAttendanceService.isTablesEnsured) return

    try {
      const schema = db.connection().schema

      // 1. kiosks table
      const hasKiosks = await schema.hasTable('kiosks')
      if (!hasKiosks) {
        try {
          await schema.createTable('kiosks', (table) => {
            table.increments('id').unsigned().primary()
            table.integer('org_id').unsigned().notNullable()
            table.integer('org_location_id').unsigned().nullable()
            table.string('name', 150).notNullable()
            table.string('location', 255).notNullable()
            table.string('device_id', 191).notNullable().unique()
            table.string('device_token', 191).nullable().unique()
            table.enum('status', ['pending', 'active', 'inactive', 'blocked']).notNullable().defaultTo('pending')
            table.timestamp('last_seen_at').nullable()
            table.integer('registered_by').unsigned().nullable()
            table.integer('approved_by').unsigned().nullable()
            table.timestamp('approved_at').nullable()
            table.timestamps(true, true)

            table.index(['org_id'], 'idx_kiosks_org_id')
            table.index(['org_id', 'status'], 'idx_kiosks_org_status')
            table.index(['org_location_id'], 'idx_kiosks_org_location_id')
          })
        } catch {
          await db.rawQuery(`
            CREATE TABLE IF NOT EXISTS kiosks (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              org_id INT UNSIGNED NOT NULL,
              org_location_id INT UNSIGNED NULL,
              name VARCHAR(150) NOT NULL,
              location VARCHAR(255) NOT NULL,
              device_id VARCHAR(191) NOT NULL UNIQUE,
              device_token VARCHAR(191) NULL UNIQUE,
              status ENUM('pending', 'active', 'inactive', 'blocked') NOT NULL DEFAULT 'pending',
              last_seen_at TIMESTAMP NULL,
              registered_by INT UNSIGNED NULL,
              approved_by INT UNSIGNED NULL,
              approved_at TIMESTAMP NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_kiosks_org_id (org_id),
              INDEX idx_kiosks_org_status (org_id, status),
              INDEX idx_kiosks_org_location_id (org_location_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `)
        }
      }

      // 2. attendance_logs table
      const hasAttendanceLogs = await schema.hasTable('attendance_logs')
      if (!hasAttendanceLogs) {
        try {
          await schema.createTable('attendance_logs', (table) => {
            table.increments('id').unsigned().primary()
            table.integer('org_id').unsigned().notNullable()
            table.integer('employee_id').unsigned().nullable()
            table.integer('kiosk_id').unsigned().nullable()
            table.date('attendance_date').notNullable()
            table.enum('type', ['check_in', 'check_out']).notNullable()
            table.enum('method', ['face', 'pin', 'qr']).notNullable()
            table.timestamp('timestamp').notNullable().defaultTo(db.rawQuery('CURRENT_TIMESTAMP'))
            table.integer('shift_id').unsigned().nullable()
            table.enum('status', ['success', 'failed', 'suspicious']).notNullable().defaultTo('success')
            table.integer('late_minutes').notNullable().defaultTo(0)
            table.integer('early_exit_minutes').notNullable().defaultTo(0)
            table.integer('overtime_minutes').notNullable().defaultTo(0)
            table.string('ip_address', 191).nullable()
            table.string('device_id', 191).nullable()
            table.string('client_reference', 191).nullable()
            table.string('image_url', 1024).nullable()
            table.text('failure_reason').nullable()
            table.timestamps(true, true)

            table.index(['org_id', 'attendance_date'], 'idx_attendance_logs_org_date')
            table.index(['employee_id', 'attendance_date'], 'idx_attendance_logs_emp_date')
            table.index(['kiosk_id', 'status'], 'idx_attendance_logs_kiosk_status')
          })
        } catch {
          await db.rawQuery(`
            CREATE TABLE IF NOT EXISTS attendance_logs (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              org_id INT UNSIGNED NOT NULL,
              employee_id INT UNSIGNED NULL,
              kiosk_id INT UNSIGNED NULL,
              attendance_date DATE NOT NULL,
              type ENUM('check_in', 'check_out') NOT NULL,
              method ENUM('face', 'pin', 'qr') NOT NULL,
              timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              shift_id INT UNSIGNED NULL,
              status ENUM('success', 'failed', 'suspicious') NOT NULL DEFAULT 'success',
              late_minutes INT NOT NULL DEFAULT 0,
              early_exit_minutes INT NOT NULL DEFAULT 0,
              overtime_minutes INT NOT NULL DEFAULT 0,
              ip_address VARCHAR(191) NULL,
              device_id VARCHAR(191) NULL,
              client_reference VARCHAR(191) NULL,
              image_url VARCHAR(1024) NULL,
              failure_reason TEXT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_attendance_logs_org_date (org_id, attendance_date),
              INDEX idx_attendance_logs_emp_date (employee_id, attendance_date),
              INDEX idx_attendance_logs_kiosk_status (kiosk_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `)
        }
      }

      // 3. employee_face_profiles table
      const hasFaceProfiles = await schema.hasTable('employee_face_profiles')
      if (!hasFaceProfiles) {
        try {
          await schema.createTable('employee_face_profiles', (table) => {
            table.increments('id').unsigned().primary()
            table.integer('org_id').unsigned().notNullable()
            table.integer('employee_id').unsigned().notNullable()
            table.text('face_embedding', 'longtext').notNullable()
            table.string('reference_image_url', 1024).nullable()
            table.enum('status', ['active', 'inactive', 'pending', 'rejected']).notNullable().defaultTo('pending')
            table.integer('created_by').unsigned().nullable()
            table.integer('approved_by').unsigned().nullable()
            table.timestamp('approved_at').nullable()
            table.timestamps(true, true)

            table.index(['org_id', 'employee_id'], 'idx_face_profiles_org_employee')
            table.index(['org_id', 'status'], 'idx_face_profiles_org_status')
          })
        } catch {
          await db.rawQuery(`
            CREATE TABLE IF NOT EXISTS employee_face_profiles (
              id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              org_id INT UNSIGNED NOT NULL,
              employee_id INT UNSIGNED NOT NULL,
              face_embedding LONGTEXT NOT NULL,
              reference_image_url VARCHAR(1024) NULL,
              status ENUM('active', 'inactive', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
              created_by INT UNSIGNED NULL,
              approved_by INT UNSIGNED NULL,
              approved_at TIMESTAMP NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              INDEX idx_face_profiles_org_employee (org_id, employee_id),
              INDEX idx_face_profiles_org_status (org_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
          `)
        }
      }

      // 4. employees columns for kiosk PIN
      const hasEmployees = await schema.hasTable('employees')
      if (hasEmployees) {
        const hasPinHash = await schema.hasColumn('employees', 'kiosk_pin_hash')
        if (!hasPinHash) {
          try {
            await schema.alterTable('employees', (table) => {
              table.string('kiosk_pin_hash', 255).nullable().after('password_hash')
            })
          } catch {
            await db.rawQuery('ALTER TABLE employees ADD COLUMN kiosk_pin_hash VARCHAR(255) NULL;')
          }
        }
        const hasAttempts = await schema.hasColumn('employees', 'kiosk_pin_attempts')
        if (!hasAttempts) {
          try {
            await schema.alterTable('employees', (table) => {
              table.integer('kiosk_pin_attempts').notNullable().defaultTo(0).after('kiosk_pin_hash')
            })
          } catch {
            await db.rawQuery('ALTER TABLE employees ADD COLUMN kiosk_pin_attempts INT NOT NULL DEFAULT 0;')
          }
        }
        const hasBlockedUntil = await schema.hasColumn('employees', 'kiosk_pin_blocked_until')
        if (!hasBlockedUntil) {
          try {
            await schema.alterTable('employees', (table) => {
              table.timestamp('kiosk_pin_blocked_until').nullable().after('kiosk_pin_attempts')
            })
          } catch {
            await db.rawQuery('ALTER TABLE employees ADD COLUMN kiosk_pin_blocked_until TIMESTAMP NULL;')
          }
        }
      }

      // 5. employee_shifts columns for effective dates
      const hasEmployeeShifts = await schema.hasTable('employee_shifts')
      if (hasEmployeeShifts) {
        const hasEffectiveFrom = await schema.hasColumn('employee_shifts', 'effective_from')
        if (!hasEffectiveFrom) {
          try {
            await schema.alterTable('employee_shifts', (table) => {
              table.date('effective_from').nullable()
            })
          } catch {
            await db.rawQuery('ALTER TABLE employee_shifts ADD COLUMN effective_from DATE NULL;')
          }
        }
        const hasEffectiveTo = await schema.hasColumn('employee_shifts', 'effective_to')
        if (!hasEffectiveTo) {
          try {
            await schema.alterTable('employee_shifts', (table) => {
              table.date('effective_to').nullable()
            })
          } catch {
            await db.rawQuery('ALTER TABLE employee_shifts ADD COLUMN effective_to DATE NULL;')
          }
        }
      }

      // 6. shifts table columns
      const hasShiftsTable = await schema.hasTable('shifts')
      if (hasShiftsTable) {
        const hasIsActive = await schema.hasColumn('shifts', 'is_active')
        if (!hasIsActive) {
          try {
            await schema.alterTable('shifts', (table) => {
              table.boolean('is_active').notNullable().defaultTo(true)
            })
          } catch {
            await db.rawQuery('ALTER TABLE shifts ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;')
          }
        }
      }

      KioskAttendanceService.isTablesEnsured = true
    } catch (error) {
      console.error('[KioskAttendanceService] ensureTables warning:', error)
    }
  }

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
    await KioskAttendanceService.ensureTables()
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
    await KioskAttendanceService.ensureTables()
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

    try {
      await KioskAttendanceService.ensureTables()
      const schema = db.connection().schema
      const hasEffectiveFrom = await schema.hasColumn('employee_shifts', 'effective_from').catch(() => false)

      let query = db
        .from('employee_shifts as es')
        .join('shifts as s', 's.id', 'es.shift_id')
        .where('es.employee_id', employeeId)
        .where('s.is_active', true)

      if (hasEffectiveFrom) {
        query = query
          .where((builder) => {
            builder.whereNull('es.effective_from').orWhere('es.effective_from', '<=', today)
          })
          .where((builder) => {
            builder.whereNull('es.effective_to').orWhere('es.effective_to', '>=', today)
          })
      }

      const assignedShift = await query
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
    } catch (err) {
      console.warn('[KioskAttendanceService] resolveShift warning:', err)
    }

    try {
      const schema = db.connection().schema
      const hasIsActive = await schema.hasColumn('shifts', 'is_active').catch(() => false)

      let fallbackQuery = db.from('shifts').where('org_id', orgId)
      if (hasIsActive) {
        fallbackQuery = fallbackQuery.where('is_active', true)
      }

      const shift = await fallbackQuery
        .select(
          'id',
          db.raw('COALESCE(shift_name, name, "General Shift") as name'),
          'start_time',
          'end_time',
          db.raw('COALESCE(grace_minutes, grace_time, 15) as grace_time'),
        )
        .orderBy('id', 'asc')
        .first()

      if (shift) return shift
    } catch (kioskShiftErr) {
      console.warn('[KioskAttendanceService] Fallback shift query warning:', kioskShiftErr)
    }

    return null
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


