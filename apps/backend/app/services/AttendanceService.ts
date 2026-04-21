import Attendance from '#models/attendance'
import Shift from '#models/shift'
import Holiday from '#models/holiday'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'

export default class AttendanceService {
    private mapShiftRecord(shift: any) {
        return {
            id: Number(shift.id),
            name: shift.shift_name ?? shift.name,
            start_time: shift.start_time,
            end_time: shift.end_time,
            grace_time: Number(shift.grace_minutes ?? shift.grace_time ?? 0),
            working_hours: this.calculateWorkingHours(shift.start_time, shift.end_time),
            shift_type: shift.shift_type ?? 'Fixed',
            is_active: Boolean(shift.is_active ?? true),
        }
    }

    private mapZoneRecord(zone: any) {
        return {
            id: Number(zone.id),
            name: zone.name,
            center_lat: Number(zone.latitude ?? zone.center_lat ?? 0),
            center_lng: Number(zone.longitude ?? zone.center_lng ?? 0),
            radius_meters: Number(zone.radius_meters ?? 100),
            is_active: Boolean(zone.is_active ?? true),
            address: zone.address ?? null,
        }
    }

    private calculateWorkingHours(start: string, end: string): number {
        const [startHour, startMinute] = String(start).split(':').map(Number)
        const [endHour, endMinute] = String(end).split(':').map(Number)
        const startTotal = (startHour * 60) + startMinute
        const endTotal = (endHour * 60) + endMinute
        const minutes = endTotal >= startTotal ? endTotal - startTotal : (24 * 60 - startTotal) + endTotal
        return Math.max(0, Math.round((minutes / 60) * 10) / 10)
    }

    private async hasOrgLocationsTable(): Promise<boolean> {
        try {
            await db.rawQuery('SELECT 1 FROM org_locations LIMIT 1')
            return true
        } catch {
            return false
        }
    }
    /**
     * Check-in employee
     */
    async checkIn(employeeId: number, orgId: number, data: any) {
        const now = DateTime.now()
        const todayStr = now.toISODate()!

        // 1. Double check-in prevention
        const query = Attendance.query()
            .where('employee_id', employeeId)
            .where('attendance_date', todayStr)
            .whereNull('check_out')

        if (data.shiftId) {
            query.where('shift_id', data.shiftId)
        }

        const existing = await query.first()
        if (existing) {
            throw new Exception('Already checked in for this session', { status: 400 })
        }

        // 2. Fetch Shift & Calculate Late Status
        let isLate = false
        let shiftIdToSave: number | null = null

        if (data.shiftId) {
            const shift = await Shift.find(data.shiftId)
            if (shift) {
                shiftIdToSave = shift.id
                const [startH, startM] = shift.startTime.split(':').map(Number)
                const shiftStartTime = now.set({ hour: startH, minute: startM, second: 0, millisecond: 0 })
                const graceEndTime = shiftStartTime.plus({ minutes: shift.graceTime || 0 })

                if (now > graceEndTime) {
                    isLate = true
                }
            } else {
                console.warn(`Shift ${data.shiftId} not found. Ignoring shift assignment.`)
            }
        }

        // 3. Holiday Check
        const holiday = await Holiday.query()
            .where('org_id', orgId)
            .where('holiday_date', todayStr)
            .first()

        const { latitude, longitude, deviceInfo, shiftId, ...rest } = data

        return await Attendance.create({
            ...rest,
            checkInLat: latitude,
            checkInLng: longitude,
            deviceInfo,
            employeeId,
            orgId,
            shiftId: shiftIdToSave,
            attendanceDate: now,
            checkIn: now,
            status: isLate ? 'late' : (holiday ? 'holiday' : 'present'),
            isLate,
        })
    }

    /**
     * Check-out employee
     */
    async checkOut(employeeId: number, data: any) {
        const now = DateTime.now()
        const attendance = await Attendance.query()
            .where('employee_id', employeeId)
            .where('attendance_date', now.toISODate()!)
            .whereNull('check_out')
            .preload('shift')
            .first()

        if (!attendance) {
            throw new Exception('No active check-in found for today', { status: 404 })
        }

        attendance.checkOut = now
        attendance.checkOutLat = data.latitude
        attendance.checkOutLng = data.longitude

        // Calculate work hours
        if (attendance.checkIn) {
            const diff = now.diff(attendance.checkIn, ['hours', 'minutes']).toObject()
            const totalHours = (diff.hours || 0) + (diff.minutes || 0) / 60
            attendance.workHours = parseFloat(totalHours.toFixed(2))
            attendance.netWorkHours = attendance.workHours // Simple for now, can subtract break late

            // Logic: Half Day if < 4 hours
            if (attendance.workHours < 4) {
                attendance.isHalfDay = true
                attendance.status = 'half_day'
            }

            // Logic: Overtime if > 9 hours (assuming 8h shift + 1h buffer)
            if (attendance.workHours > 9) {
                attendance.isOvertime = true
            }
        }

        if (data.source) attendance.source = data.source
        if (data.selfieUrl) attendance.selfieUrl = data.selfieUrl
        if (data.biometricRef) attendance.biometricRef = data.biometricRef
        if (data.deviceInfo) attendance.deviceInfo = data.deviceInfo

        await attendance.save()
        return attendance
    }

    /**
     * Get attendance history
     */
    async getHistory(employeeId: number, orgId: number, startDate: string, endDate: string) {
        return await Attendance.query()
            .where('employee_id', employeeId)
            .where('org_id', orgId)
            .whereBetween('attendance_date', [startDate, endDate])
            .orderBy('attendance_date', 'desc')
    }

    /**
     * Get today's attendance for an employee
     */
    async getTodayAttendance(employeeId: number) {
        const today = DateTime.now().toISODate()!
        
        const attendance = await Attendance.query()
            .where('employee_id', employeeId)
            .where('attendance_date', today)
            .preload('shift')
            .first()

        if (!attendance) {
            return {
                is_clocked_in: false,
                is_clocked_out: false,
                current_status: 'offline',
                break_time_minutes: 0,
                total_work_hours: 0,
                overtime_hours: 0
            }
        }

        // Calculate work hours
        let totalWorkHours = 0
        let overtimeHours = 0
        let breakTimeMinutes = 0

        if (attendance.checkIn) {
            const checkInTime = DateTime.fromISO(attendance.checkIn.toString())
            const checkOutTime = attendance.checkOut 
                ? DateTime.fromISO(attendance.checkOut.toString())
                : DateTime.now()
            
            const diff = checkOutTime.diff(checkInTime, ['hours', 'minutes']).toObject()
            totalWorkHours = parseFloat(((diff.hours || 0) + (diff.minutes || 0) / 60).toFixed(2))
            
            // Calculate overtime (beyond 9 hours)
            if (totalWorkHours > 9) {
                overtimeHours = totalWorkHours - 9
            }
        }

        return {
            id: attendance.id,
            is_clocked_in: !!attendance.checkIn,
            is_clocked_out: !!attendance.checkOut,
            check_in: attendance.checkIn?.toISO(),
            check_out: attendance.checkOut?.toISO(),
            current_status: attendance.checkIn && !attendance.checkOut ? 'working' : 
                          (attendance.checkOut ? 'offline' : 'offline'),
            break_time_minutes: breakTimeMinutes,
            total_work_hours: totalWorkHours,
            overtime_hours: overtimeHours,
            shift: attendance.shift ? {
                id: attendance.shift.id,
                name: attendance.shift.name,
                start_time: attendance.shift.startTime,
                end_time: attendance.shift.endTime
            } : undefined,
            last_location: attendance.checkInLat && attendance.checkInLng ? {
                lat: attendance.checkInLat,
                lng: attendance.checkInLng
            } : undefined
        }
    }

    /**
     * Start a break
     */
    async startBreak(employeeId: number, _data: { type?: string }) {
        const today = DateTime.now().toISODate()!
        
        // Find active attendance without check-out
        const attendance = await Attendance.query()
            .where('employee_id', employeeId)
            .where('attendance_date', today)
            .whereNull('check_out')
            .first()

        if (!attendance) {
            throw new Exception('No active check-in found', { status: 404 })
        }

        // Check if already on break
        if (attendance.breakStart) {
            throw new Exception('Already on break', { status: 400 })
        }

        attendance.breakStart = DateTime.now()
        await attendance.save()

        return attendance
    }

    /**
     * End a break
     */
    async endBreak(employeeId: number) {
        const today = DateTime.now().toISODate()!
        
        const attendance = await Attendance.query()
            .where('employee_id', employeeId)
            .where('attendance_date', today)
            .whereNull('check_out')
            .first()

        if (!attendance || !attendance.breakStart) {
            throw new Exception('No active break found', { status: 404 })
        }

        const breakEnd = DateTime.now()
        const breakDuration = breakEnd.diff(DateTime.fromISO(attendance.breakStart.toString()), 'minutes').minutes
        
        attendance.breakEnd = breakEnd
        attendance.breakDuration = Math.round(breakDuration)
        await attendance.save()

        return attendance
    }

    /**
     * Get today's breaks
     */
    async getTodayBreaks(employeeId: number) {
        const today = DateTime.now().toISODate()!
        
        const attendance = await Attendance.query()
            .where('employee_id', employeeId)
            .where('attendance_date', today)
            .first()

        if (!attendance || !attendance.breakStart) {
            return []
        }

        return [{
            id: attendance.id,
            attendance_id: attendance.id,
            start_time: attendance.breakStart?.toISO(),
            end_time: attendance.breakEnd?.toISO(),
            duration_minutes: attendance.breakDuration || 0,
            type: 'break'
        }]
    }

    /**
     * Get attendance statistics
     */
    async getStats(employeeId: number, orgId: number, period: string) {
        let startDate: DateTime
        const now = DateTime.now()

        switch (period) {
            case 'week':
                startDate = now.minus({ weeks: 1 })
                break
            case 'year':
                startDate = now.minus({ years: 1 })
                break
            case 'month':
            default:
                startDate = now.minus({ months: 1 })
        }

        const records = await Attendance.query()
            .where('employee_id', employeeId)
            .where('org_id', orgId)
            .where('attendance_date', '>=', startDate.toISODate()!)
            .exec()

        const stats = {
            total_present: 0,
            total_absent: 0,
            total_late: 0,
            total_half_day: 0,
            total_leave: 0,
            total_holiday: 0,
            total_weekend: 0,
            total_work_hours: 0,
            average_arrival_time: '09:00',
            punctuality_percentage: 0,
            overtime_hours: 0
        }

        let totalOnTime = 0

        for (const record of records) {
            switch (record.status) {
                case 'present':
                    stats.total_present++
                    totalOnTime++
                    break
                case 'absent':
                    stats.total_absent++
                    break
                case 'late':
                    stats.total_late++
                    break
                case 'half_day':
                    stats.total_half_day++
                    totalOnTime++
                    break
                case 'on_leave':
                    stats.total_leave++
                    break
                case 'holiday':
                    stats.total_holiday++
                    break
                case 'weekend':
                    stats.total_weekend++
                    break
            }

            if (record.workHours) {
                stats.total_work_hours += record.workHours
            }
            if (record.isOvertime) {
                stats.overtime_hours += (record.workHours || 0) - 9
            }
        }

        const totalDays = stats.total_present + stats.total_late + stats.total_half_day
        if (totalDays > 0) {
            stats.punctuality_percentage = Math.round((totalOnTime / totalDays) * 100)
        }

        return stats
    }

    /**
     * Get monthly attendance
     */
    async getMonthlyAttendance(employeeId: number, orgId: number, year: number, month: number) {
        const startDate = DateTime.fromObject({ year, month, day: 1 })
        const endDate = startDate.endOf('month')

        return await Attendance.query()
            .where('employee_id', employeeId)
            .where('org_id', orgId)
            .where('attendance_date', '>=', startDate.toISODate()!)
            .where('attendance_date', '<=', endDate.toISODate()!)
            .orderBy('attendance_date', 'asc')
    }

    /**
     * Request manual attendance
     */
    async requestManualAttendance(employeeId: number, orgId: number, data: {
        date: string,
        check_in: string,
        check_out?: string,
        reason: string
    }) {
        // Store in a simple way - you might want a separate table for this
        const result = await db.table('attendance_regularizations').insert({
            employee_id: employeeId,
            org_id: orgId,
            regularization_date: data.date,
            check_in: data.check_in,
            check_out: data.check_out || null,
            reason: data.reason,
            status: 'pending',
            created_at: DateTime.now().toISO()
        })

        return result
    }

    /**
     * Get manual attendance requests
     */
    async getManualRequests(employeeId: number) {
        const results = await db.from('attendance_regularizations')
            .where('employee_id', employeeId)
            .orderBy('created_at', 'desc')
            .limit(50)

        return results.map(r => ({
            id: r.id,
            employee_id: r.employee_id,
            date: r.regularization_date,
            check_in: r.check_in,
            check_out: r.check_out,
            reason: r.reason,
            status: r.status,
            approved_by: r.approved_by,
            approved_at: r.approved_at,
            created_at: r.created_at
        }))
    }

    /**
     * Process manual attendance request
     */
    async processManualRequest(requestId: number, adminId: number, action: 'approved' | 'rejected', reason?: string) {
        const request = await db.from('attendance_regularizations')
            .where('id', requestId)
            .first()

        if (!request) {
            throw new Exception('Request not found', { status: 404 })
        }

        await db.from('attendance_regularizations')
            .where('id', requestId)
            .update({
                status: action,
                approved_by: adminId,
                approved_at: DateTime.now().toISO(),
                rejection_reason: reason || null
            })

        // If approved, create/update attendance
        if (action === 'approved') {
            await db.from('attendances')
                .where('employee_id', request.employee_id)
                .where('attendance_date', request.regularization_date)
                .update({
                    check_in: request.check_in,
                    check_out: request.check_out
                })
        }

        return { success: true, action }
    }

    /**
     * Request overtime
     */
    async requestOvertime(employeeId: number, orgId: number, data: {
        date: string,
        hours: number,
        reason: string
    }) {
        const result = await db.table('overtime_requests').insert({
            employee_id: employeeId,
            org_id: orgId,
            date: data.date,
            hours: data.hours,
            reason: data.reason,
            status: 'pending',
            created_at: DateTime.now().toISO()
        })

        return result
    }

    /**
     * Get overtime records
     */
    async getOvertimeRecords(employeeId: number) {
        const results = await db.from('overtime_requests')
            .where('employee_id', employeeId)
            .orderBy('date', 'desc')
            .limit(50)

        return results
    }

    /**
     * Validate location (simple distance check)
     */
    async validateLocation(lat: number, lng: number, orgId: number) {
        // Get organization's geo-fence centers
        if (!(await this.hasOrgLocationsTable())) {
            return { valid: true }
        }

        const zones = await db.from('org_locations')
            .where('org_id', orgId)
            .where('is_active', 1)
            .limit(10)

        if (zones.length === 0) {
            // No zones defined - allow all
            return { valid: true }
        }

        for (const zone of zones) {
            const distance = this.calculateDistance(lat, lng, zone.latitude, zone.longitude)
            if (distance <= zone.radius_meters) {
                return {
                    valid: true,
                    zone: {
                        id: zone.id,
                        name: zone.name,
                        center_lat: zone.latitude,
                        center_lng: zone.longitude,
                        radius_meters: zone.radius_meters
                    },
                    distance: Math.round(distance)
                }
            }
        }

        return { valid: false }
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000 // Earth's radius in meters
        const dLat = this.toRad(lat2 - lat1)
        const dLng = this.toRad(lng2 - lng1)
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180)
    }

    /**
     * Get geo-fence zones
     */
    async getGeoFenceZones(orgId: number) {
        const zones = await db.from('org_locations')
            .where('org_id', orgId)
            .orderBy('name', 'asc')

        return zones.map((zone) => this.mapZoneRecord(zone))
    }

    async createGeoFenceZone(orgId: number, data: {
        name: string
        latitude: number
        longitude: number
        radius_meters: number
        is_active?: boolean
        address?: string | null
    }) {
        const [id] = await db.table('org_locations').insert({
            org_id: orgId,
            name: data.name,
            latitude: data.latitude,
            longitude: data.longitude,
            radius_meters: data.radius_meters,
            is_active: data.is_active ?? true,
            address: data.address ?? null,
            created_at: DateTime.now().toSQL(),
            updated_at: DateTime.now().toSQL(),
        })

        const created = await db.from('org_locations').where('id', id).first()
        return this.mapZoneRecord(created)
    }

    async updateGeoFenceZone(orgId: number, id: number, data: {
        name?: string
        latitude?: number
        longitude?: number
        radius_meters?: number
        is_active?: boolean
        address?: string | null
    }) {
        const zone = await db.from('org_locations')
            .where('org_id', orgId)
            .where('id', id)
            .first()

        if (!zone) {
            throw new Exception('Geo-fence zone not found', { status: 404 })
        }

        await db.from('org_locations')
            .where('org_id', orgId)
            .where('id', id)
            .update({
                name: data.name ?? zone.name,
                latitude: data.latitude ?? zone.latitude,
                longitude: data.longitude ?? zone.longitude,
                radius_meters: data.radius_meters ?? zone.radius_meters,
                is_active: data.is_active ?? zone.is_active,
                address: data.address ?? zone.address,
                updated_at: DateTime.now().toSQL(),
            })

        const updated = await db.from('org_locations').where('id', id).first()
        return this.mapZoneRecord(updated)
    }

    async deleteGeoFenceZone(orgId: number, id: number) {
        const affectedRows = await db.from('org_locations')
            .where('org_id', orgId)
            .where('id', id)
            .delete()

        if (!affectedRows) {
            throw new Exception('Geo-fence zone not found', { status: 404 })
        }

        return { success: true }
    }

    async getGeoFenceSettings(orgId: number) {
        const organization = await db.from('organizations').where('id', orgId).first()

        if (!organization) {
            throw new Exception('Organization not found', { status: 404 })
        }

        return {
            geofence_enabled: Boolean(organization.geofence_enabled ?? false),
            require_geofence_for_all: Boolean(organization.require_geofence_for_all ?? false),
            default_geofence_id: organization.default_geofence_id ?? null,
            zones: await this.getGeoFenceZones(orgId),
        }
    }

    async updateGeoFenceSettings(orgId: number, data: {
        geofence_enabled?: boolean
        require_geofence_for_all?: boolean
        default_geofence_id?: number | null
    }) {
        const organization = await db.from('organizations').where('id', orgId).first()

        if (!organization) {
            throw new Exception('Organization not found', { status: 404 })
        }

        if (data.default_geofence_id !== undefined && data.default_geofence_id !== null) {
            const zone = await db.from('org_locations')
                .where('org_id', orgId)
                .where('id', data.default_geofence_id)
                .first()

            if (!zone) {
                throw new Exception('Default geo-fence zone not found', { status: 404 })
            }
        }

        const payload: Record<string, any> = {}
        if (data.geofence_enabled !== undefined) {
            payload.geofence_enabled = data.geofence_enabled
        }
        if (data.require_geofence_for_all !== undefined) {
            payload.require_geofence_for_all = data.require_geofence_for_all
        }
        if (data.default_geofence_id !== undefined) {
            payload.default_geofence_id = data.default_geofence_id
        }

        if (Object.keys(payload).length > 0) {
            try {
                await db.from('organizations').where('id', orgId).update(payload)
            } catch {
                // Keep the API stable for older databases that do not yet have geofence columns.
            }
        }

        return this.getGeoFenceSettings(orgId)
    }

    /**
     * Get all attendance (admin)
     */
    async getAllAttendance(orgId: number, filters: {
        startDate?: string,
        endDate?: string,
        employeeId?: number,
        departmentId?: number,
        status?: string
    }) {
        let query = Attendance.query()
            .where('org_id', orgId)
            .preload('employee')

        if (filters.startDate) {
            query = query.where('attendance_date', '>=', filters.startDate)
        }
        if (filters.endDate) {
            query = query.where('attendance_date', '<=', filters.endDate)
        }
        if (filters.employeeId) {
            query = query.where('employee_id', filters.employeeId)
        }
        if (filters.status) {
            query = query.where('status', filters.status)
        }

        return await query.orderBy('attendance_date', 'desc').limit(500)
    }

    /**
     * Get today's all attendance (admin)
     */
    async getTodayAllAttendance(orgId: number) {
        const today = DateTime.now().toISODate()!

        return await Attendance.query()
            .where('org_id', orgId)
            .where('attendance_date', today)
            .preload('employee', (query) => {
                query.select('id', 'first_name', 'last_name', 'email', 'department_id')
            })
            .orderBy('check_in', 'asc')
    }

    /**
     * Get shifts
     */
    async getShifts(orgId: number) {
        const shifts = await db.from('shifts')
            .where('org_id', orgId)
            .orderBy('start_time', 'asc')

        return shifts.map((shift) => this.mapShiftRecord(shift))
    }

    async createShift(orgId: number, data: {
        name: string
        start_time: string
        end_time: string
        grace_time?: number
        is_active?: boolean
    }) {
        const [id] = await db.table('shifts').insert({
            org_id: orgId,
            shift_name: data.name,
            start_time: data.start_time,
            end_time: data.end_time,
            grace_minutes: data.grace_time ?? 0,
            is_active: data.is_active ?? true,
        })

        const created = await db.from('shifts').where('id', id).first()
        return this.mapShiftRecord(created)
    }

    async updateShift(orgId: number, id: number, data: {
        name?: string
        start_time?: string
        end_time?: string
        grace_time?: number
        is_active?: boolean
    }) {
        const shift = await db.from('shifts')
            .where('org_id', orgId)
            .where('id', id)
            .first()

        if (!shift) {
            throw new Exception('Shift not found', { status: 404 })
        }

        await db.from('shifts')
            .where('org_id', orgId)
            .where('id', id)
            .update({
                shift_name: data.name ?? shift.shift_name,
                start_time: data.start_time ?? shift.start_time,
                end_time: data.end_time ?? shift.end_time,
                grace_minutes: data.grace_time ?? shift.grace_minutes ?? 0,
                is_active: data.is_active ?? shift.is_active,
            })

        const updated = await db.from('shifts').where('id', id).first()
        return this.mapShiftRecord(updated)
    }

    async deleteShift(orgId: number, id: number) {
        const affectedRows = await db.from('shifts')
            .where('org_id', orgId)
            .where('id', id)
            .delete()

        if (!affectedRows) {
            throw new Exception('Shift not found', { status: 404 })
        }

        return { success: true }
    }

    /**
     * Process manual attendance (admin)
     */
    async processManualAttendance(requestId: number, action: 'approved' | 'rejected', reason?: string, adminId?: number) {
        return this.processManualRequest(requestId, adminId || 0, action, reason)
    }
}

