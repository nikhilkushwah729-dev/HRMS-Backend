import AttendanceRegularization from '#models/attendance_regularization'
import Attendance from '#models/attendance'
import Payroll from '#models/payroll'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'

export default class RegularizationService {
    /**
     * Submit a regularization request
     */
    async submitRequest(employeeId: number, orgId: number, data: any) {
        const rawDate = data.date || data.regularizationDate
        if (!rawDate) {
            throw new Exception('Date is required for regularization', { status: 400 })
        }

        const date = DateTime.fromISO(String(rawDate))
        if (!date.isValid) {
            throw new Exception('Invalid date provided for regularization', { status: 400 })
        }

        // Attendance locking: prevent changes if payroll has been processed or paid for this month
        const isPayrollLocked = await Payroll.query()
            .where('org_id', orgId)
            .where('month', date.month)
            .where('year', date.year)
            .where((q) => {
                q.where('employee_id', employeeId).orWhere('is_locked', true)
            })
            .where((q) => {
                q.where('is_locked', true).orWhereIn('status', ['processed', 'paid'])
            })
            .first()

        if (isPayrollLocked) {
            throw new Exception('Attendance for this period is locked because payroll has already been processed or paid', { status: 400 })
        }

        const checkIn = data.checkIn || data.check_in || null
        const checkOut = data.checkOut || data.check_out || null

        // Check if an existing attendance record exists for this employee and date
        let attendanceId = data.attendanceId ? Number(data.attendanceId) : null
        if (!attendanceId) {
            const existingAttendance = await Attendance.query()
                .where('employee_id', employeeId)
                .where('org_id', orgId)
                .where('attendance_date', date.toISODate()!)
                .first()

            if (existingAttendance) {
                attendanceId = existingAttendance.id
            }
        }

        return await AttendanceRegularization.create({
            employeeId,
            orgId,
            attendanceId,
            regularizationDate: date,
            checkIn: checkIn ? String(checkIn).trim() : null,
            checkOut: checkOut ? String(checkOut).trim() : null,
            type: data.type || 'missed_punch',
            reason: String(data.reason || '').trim(),
            status: 'pending',
        })
    }

    /**
     * Approve/Reject a request with strict tenant isolation and full attendance synchronization
     */
    async processRequest(requestId: number, adminId: number, orgId: number, status: 'approved' | 'rejected', notes?: string) {
        const request = await AttendanceRegularization.query()
            .where('id', requestId)
            .where('org_id', orgId)
            .first()

        if (!request) {
            throw new Exception('Regularization request not found in your organization', { status: 404 })
        }

        // Attendance locking: ensure approval cannot alter attendance if payroll has already been locked/processed
        const regMonth = request.regularizationDate instanceof DateTime
            ? request.regularizationDate.month
            : DateTime.fromISO(String(request.regularizationDate)).month
        const regYear = request.regularizationDate instanceof DateTime
            ? request.regularizationDate.year
            : DateTime.fromISO(String(request.regularizationDate)).year

        const isPayrollLocked = await Payroll.query()
            .where('org_id', orgId)
            .where('month', regMonth)
            .where('year', regYear)
            .where((q) => {
                q.where('employee_id', request.employeeId).orWhere('is_locked', true)
            })
            .where((q) => {
                q.where('is_locked', true).orWhereIn('status', ['processed', 'paid'])
            })
            .first()

        if (isPayrollLocked) {
            throw new Exception('Cannot process regularization: attendance for this period is locked because payroll has already been processed or paid', { status: 400 })
        }

        request.status = status
        request.adminNotes = notes || null
        if (status === 'rejected') {
            request.rejectionReason = notes || null
        }
        request.approvedBy = adminId
        request.approvedAt = DateTime.now()

        // If approved, create or update the attendance record with authoritative timestamps
        if (status === 'approved') {
            const dateStr = request.regularizationDate instanceof DateTime
                ? request.regularizationDate.toISODate()!
                : DateTime.fromISO(String(request.regularizationDate)).toISODate()!

            let attendance = request.attendanceId ? await Attendance.find(request.attendanceId) : null
            if (!attendance) {
                attendance = await Attendance.query()
                    .where('employee_id', request.employeeId)
                    .where('org_id', orgId)
                    .where('attendance_date', dateStr)
                    .first()
            }

            const checkInTimeStr = request.checkIn || '09:00:00'
            const checkOutTimeStr = request.checkOut || '18:00:00'

            const formattedCheckInTime = checkInTimeStr.length === 5 ? `${checkInTimeStr}:00` : checkInTimeStr
            const formattedCheckOutTime = checkOutTimeStr.length === 5 ? `${checkOutTimeStr}:00` : checkOutTimeStr

            const parsedCheckIn = DateTime.fromISO(`${dateStr}T${formattedCheckInTime}`)
            let parsedCheckOut = DateTime.fromISO(`${dateStr}T${formattedCheckOutTime}`)

            // Overnight shift handling: if check-out time is earlier than check-in time, rolls over to next morning
            if (parsedCheckIn.isValid && parsedCheckOut.isValid && parsedCheckOut < parsedCheckIn) {
                parsedCheckOut = parsedCheckOut.plus({ days: 1 })
            }

            let calculatedWorkHours = 8
            if (parsedCheckIn.isValid && parsedCheckOut.isValid) {
                const diff = parsedCheckOut.diff(parsedCheckIn, ['hours', 'minutes']).toObject()
                const hours = (diff.hours || 0) + (diff.minutes || 0) / 60
                calculatedWorkHours = Math.max(0, parseFloat(hours.toFixed(2)))
            }

            const isHalfDay = request.type === 'half_day' || (calculatedWorkHours > 0 && calculatedWorkHours < 4)
            const isOvertime = request.type === 'overtime' || calculatedWorkHours > 9

            if (attendance) {
                if (parsedCheckIn.isValid) {
                    attendance.checkIn = parsedCheckIn
                }
                if (parsedCheckOut.isValid && request.checkOut) {
                    attendance.checkOut = parsedCheckOut
                }
                if (calculatedWorkHours > 0) {
                    attendance.workHours = calculatedWorkHours
                }
                const breakHours = Number(attendance.totalBreakMin || 0) / 60
                attendance.netWorkHours = Math.max(0, parseFloat(((attendance.workHours || calculatedWorkHours) - breakHours).toFixed(2)))

                // Status preservation and policy mapping:
                if (isHalfDay) {
                    attendance.status = 'half_day'
                    attendance.isHalfDay = true
                } else if (request.type === 'late_arrival') {
                    // Regularization explicitly requested to excuse late arrival
                    attendance.isLate = false
                    attendance.status = 'present'
                } else if (attendance.isLate) {
                    // Preserves late status when regularizing missed punches or other requests
                    attendance.status = 'late'
                } else {
                    attendance.status = 'present'
                }

                if (isOvertime) {
                    attendance.isOvertime = true
                }

                attendance.source = 'manual'
                attendance.modifiedBy = adminId
                attendance.modifiedAt = DateTime.now()
                await attendance.save()
            } else {
                let initialStatus: 'present' | 'half_day' | 'late' = 'present'
                if (isHalfDay) {
                    initialStatus = 'half_day'
                }

                attendance = await Attendance.create({
                    employeeId: request.employeeId,
                    orgId: request.orgId,
                    attendanceDate: DateTime.fromISO(dateStr),
                    checkIn: parsedCheckIn.isValid ? parsedCheckIn : DateTime.fromISO(`${dateStr}T09:00:00`),
                    checkOut: parsedCheckOut.isValid ? parsedCheckOut : DateTime.fromISO(`${dateStr}T18:00:00`),
                    workHours: calculatedWorkHours,
                    netWorkHours: calculatedWorkHours,
                    status: initialStatus,
                    isLate: false,
                    isHalfDay: isHalfDay,
                    isOvertime: isOvertime,
                    totalBreakMin: 0,
                    source: 'manual',
                    notes: `Regularized: ${request.reason}`,
                    modifiedBy: adminId,
                    modifiedAt: DateTime.now(),
                })
            }

            request.attendanceId = attendance.id
        }

        await request.save()
        return request
    }

    /**
     * Get regularization requests with rich filtering
     */
    async getRequests(orgId: number, filters: {
        employeeId?: number
        status?: string
        type?: string
        startDate?: string
        endDate?: string
    }) {
        let query = AttendanceRegularization.query()
            .where('org_id', orgId)
            .preload('employee')
            .orderBy('created_at', 'desc')

        if (filters.employeeId) {
            query = query.where('employee_id', filters.employeeId)
        }
        if (filters.status) {
            query = query.where('status', filters.status)
        }
        if (filters.type) {
            query = query.where('type', filters.type)
        }
        if (filters.startDate) {
            query = query.where('regularization_date', '>=', filters.startDate)
        }
        if (filters.endDate) {
            query = query.where('regularization_date', '<=', filters.endDate)
        }

        return await query
    }

    /**
     * Get pending requests for org (backward compatibility)
     */
    async getPendingRequests(orgId: number) {
        return this.getRequests(orgId, { status: 'pending' })
    }
}
