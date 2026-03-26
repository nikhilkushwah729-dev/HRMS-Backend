import AttendanceRegularization from '#models/attendance_regularization'
import Attendance from '#models/attendance'
import { DateTime } from 'luxon'
import { Exception } from '@adonisjs/core/exceptions'

export default class RegularizationService {
    /**
     * Submit a regularization request
     */
    async submitRequest(employeeId: number, orgId: number, data: any) {
        return await AttendanceRegularization.create({
            employeeId,
            orgId,
            attendanceId: data.attendanceId,
            regularizationDate: DateTime.fromISO(data.date),
            type: data.type,
            reason: data.reason,
            status: 'pending'
        })
    }

    /**
     * Approve/Reject a request
     */
    async processRequest(requestId: number, adminId: number, status: 'approved' | 'rejected', notes?: string) {
        const request = await AttendanceRegularization.query()
            .where('id', requestId)
            .first()

        if (!request) {
            throw new Exception('Request not found', { status: 404 })
        }

        request.status = status
        request.adminNotes = notes || null
        request.approvedBy = adminId
        request.approvedAt = DateTime.now()

        await request.save()

        // If approved, optionally update the attendance record
        if (status === 'approved' && request.attendanceId) {
            const attendance = await Attendance.find(request.attendanceId)
            if (attendance) {
                // Logic based on type
                if (request.type === 'missed_punch') {
                    // Update check in/out if needed, but usually missed punch is a new record or update
                }
                attendance.status = 'present' // Mark as present after regularization
                await attendance.save()
            }
        }

        return request
    }

    /**
     * Get pending requests for org
     */
    async getPendingRequests(orgId: number) {
        return await AttendanceRegularization.query()
            .where('org_id', orgId)
            .where('status', 'pending')
            .preload('employee')
            .orderBy('created_at', 'desc')
    }
}
