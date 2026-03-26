import Attendance from '#models/attendance'
import Shift from '#models/shift'
import Holiday from '#models/holiday'
import Employee from '#models/employee'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'
import db from '@adonisjs/lucid/services/db'

export default class AttendanceService {
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
    async getTodayAttendance(employeeId: number, orgId: number) {
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
    async startBreak(employeeId: number, data: { type?: string }) {
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
            attendance_date: data.date,
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
            date: r.attendance_date,
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
                .where('attendance_date', request.attendance_date)
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
            .where('is_active', 1)

        return zones.map(z => ({
            id: z.id,
            name: z.name,
            center_lat: z.latitude,
            center_lng: z.longitude,
            radius_meters: z.radius_meters,
            is_active: z.is_active
        }))
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
        return await Shift.query()
            .where('org_id', orgId)
            .orderBy('start_time', 'asc')
    }

    /**
     * Process manual attendance (admin)
     */
    async processManualAttendance(requestId: number, action: 'approved' | 'rejected', reason?: string, adminId?: number) {
        return this.processManualRequest(requestId, adminId || 0, action, reason)
    }
}

