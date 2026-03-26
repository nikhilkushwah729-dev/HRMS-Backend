import { HttpContext } from '@adonisjs/core/http'
import AttendanceService from '#services/AttendanceService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'

@inject()
export default class AttendancesController {
    constructor(protected attendanceService: AttendanceService) { }

    static checkInValidator = vine.compile(
        vine.object({
            shiftId: vine.number().optional(),
            latitude: vine.number().optional(),
            longitude: vine.number().optional(),
            deviceInfo: vine.string().optional(),
            source: vine.enum(['manual', 'biometric', 'mobile', 'web', 'geo_fence', 'camera', 'face']).optional(),
            selfieUrl: vine.string().optional(),
            biometricRef: vine.string().optional(),
        })
    )

    static checkOutValidator = vine.compile(
        vine.object({
            latitude: vine.number().optional(),
            longitude: vine.number().optional(),
            deviceInfo: vine.string().optional(),
            source: vine.enum(['manual', 'biometric', 'mobile', 'web', 'geo_fence', 'camera', 'face']).optional(),
            selfieUrl: vine.string().optional(),
            biometricRef: vine.string().optional(),
        })
    )

    static manualAttendanceValidator = vine.compile(
        vine.object({
            date: vine.string(),
            check_in: vine.string(),
            check_out: vine.string().optional(),
            reason: vine.string(),
        })
    )

    static overtimeValidator = vine.compile(
        vine.object({
            date: vine.string(),
            hours: vine.number(),
            reason: vine.string(),
        })
    )

    static processManualValidator = vine.compile(
        vine.object({
            request_id: vine.number(),
            action: vine.enum(['approved', 'rejected']),
            reason: vine.string().optional(),
        })
    )

    /**
     * Check-in
     */
    async checkIn({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AttendancesController.checkInValidator)

        // Handle Base64 Selfie Image
        if (data.selfieUrl && data.selfieUrl.startsWith('data:image')) {
            try {
                const base64Data = data.selfieUrl.replace(/^data:image\/\w+;base64,/, '')
                const buffer = Buffer.from(base64Data, 'base64')
                const fileName = `${randomUUID()}-${employee.id}.jpg`
                const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'attendances')
                await fs.mkdir(uploadsDir, { recursive: true })
                await fs.writeFile(path.join(uploadsDir, fileName), buffer)
                data.selfieUrl = `/uploads/attendances/${fileName}`
            } catch (err) {
                console.error("Error saving selfie base64", err)
                data.selfieUrl = undefined
            }
        }

        const result = await this.attendanceService.checkIn(employee.id, employee.orgId, data)
        return response.created({
            status: 'success',
            message: 'Checked-in successfully',
            data: result,
        })
    }

    /**
     * Check-out
     */
    async checkOut({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AttendancesController.checkOutValidator)
        const result = await this.attendanceService.checkOut(employee.id, data)
        return response.ok({
            status: 'success',
            message: 'Checked-out successfully',
            data: result,
        })
    }

    /**
     * Get employee attendance history
     */
    async history({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        let { startDate, endDate } = request.qs()

        // Default to current month if dates not provided
        if (!startDate || !endDate) {
            const now = DateTime.now()
            startDate = startDate || now.startOf('month').toISODate()
            endDate = endDate || now.endOf('month').toISODate()
        }

        const history = await this.attendanceService.getHistory(employee.id, employee.orgId, startDate, endDate)
        return response.ok({
            status: 'success',
            data: history,
        })
    }

    /**
     * Get today's attendance
     */
    async getToday({ auth, response }: HttpContext) {
        const employee = auth.user!
        const today = await this.attendanceService.getTodayAttendance(employee.id, employee.orgId)
        return response.ok({
            status: 'success',
            data: today,
        })
    }

    /**
     * Start a break
     */
    async startBreak({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { type } = request.body() || {}
        const result = await this.attendanceService.startBreak(employee.id, { type })
        return response.ok({
            status: 'success',
            message: 'Break started',
            data: result,
        })
    }

    /**
     * End a break
     */
    async endBreak({ auth, response }: HttpContext) {
        const employee = auth.user!
        const result = await this.attendanceService.endBreak(employee.id)
        return response.ok({
            status: 'success',
            message: 'Break ended',
            data: result,
        })
    }

    /**
     * Get today's breaks
     */
    async getTodayBreaks({ auth, response }: HttpContext) {
        const employee = auth.user!
        const breaks = await this.attendanceService.getTodayBreaks(employee.id)
        return response.ok({
            status: 'success',
            data: breaks,
        })
    }

    /**
     * Get attendance statistics
     */
    async getStats({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { period = 'month' } = request.qs()
        const stats = await this.attendanceService.getStats(employee.id, employee.orgId, period)
        return response.ok({
            status: 'success',
            data: stats,
        })
    }

    /**
     * Get monthly attendance
     */
    async getMonthly({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { year, month } = request.qs()

        const currentYear = year ? parseInt(year as string) : DateTime.now().year
        const currentMonth = month ? parseInt(month as string) : DateTime.now().month

        const records = await this.attendanceService.getMonthlyAttendance(
            employee.id,
            employee.orgId,
            currentYear,
            currentMonth
        )

        return response.ok({
            status: 'success',
            data: records,
        })
    }

    /**
     * Request manual attendance
     */
    async requestManual({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AttendancesController.manualAttendanceValidator)

        const result = await this.attendanceService.requestManualAttendance(
            employee.id,
            employee.orgId,
            data
        )

        return response.ok({
            status: 'success',
            message: 'Manual attendance request submitted',
            data: result,
        })
    }

    /**
     * Get manual attendance requests
     */
    async getManualRequests({ auth, response }: HttpContext) {
        const employee = auth.user!
        const requests = await this.attendanceService.getManualRequests(employee.id)
        return response.ok({
            status: 'success',
            data: requests,
        })
    }

    /**
     * Process manual attendance (admin)
     */
    async processManual({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AttendancesController.processManualValidator)

        const result = await this.attendanceService.processManualAttendance(
            data.request_id,
            data.action,
            data.reason,
            employee.id
        )

        return response.ok({
            status: 'success',
            message: `Request ${data.action}`,
            data: result,
        })
    }

    /**
     * Request overtime
     */
    async requestOvertime({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(AttendancesController.overtimeValidator)

        const result = await this.attendanceService.requestOvertime(
            employee.id,
            employee.orgId,
            data
        )

        return response.ok({
            status: 'success',
            message: 'Overtime request submitted',
            data: result,
        })
    }

    /**
     * Get overtime records
     */
    async getOvertime({ auth, response }: HttpContext) {
        const employee = auth.user!
        const records = await this.attendanceService.getOvertimeRecords(employee.id)
        return response.ok({
            status: 'success',
            data: records,
        })
    }

    /**
     * Validate location
     */
    async validateLocation({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { lat, lng } = request.qs()

        if (!lat || !lng) {
            return response.badRequest({ status: 'error', message: 'lat and lng are required' })
        }

        const result = await this.attendanceService.validateLocation(
            parseFloat(lat as string),
            parseFloat(lng as string),
            employee.orgId
        )

        return response.ok({
            status: 'success',
            data: result,
        })
    }

    /**
     * Get geo-fence zones
     */
    async getZones({ auth, response }: HttpContext) {
        const employee = auth.user!
        const zones = await this.attendanceService.getGeoFenceZones(employee.orgId)
        return response.ok({
            status: 'success',
            data: zones,
        })
    }

    /**
     * Get all attendance (admin)
     */
    async getAll({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { startDate, endDate, employeeId, departmentId, status } = request.qs()

        const records = await this.attendanceService.getAllAttendance(employee.orgId, {
            startDate: startDate as string,
            endDate: endDate as string,
            employeeId: employeeId ? parseInt(employeeId as string) : undefined,
            departmentId: departmentId ? parseInt(departmentId as string) : undefined,
            status: status as string,
        })

        return response.ok({
            status: 'success',
            data: records,
        })
    }

    /**
     * Get today's all attendance (admin)
     */
    async getTodayAll({ auth, response }: HttpContext) {
        const employee = auth.user!
        const records = await this.attendanceService.getTodayAllAttendance(employee.orgId)
        return response.ok({
            status: 'success',
            data: records,
        })
    }

    /**
     * Get shifts
     */
    async getShifts({ auth, response }: HttpContext) {
        const employee = auth.user!
        const shifts = await this.attendanceService.getShifts(employee.orgId)
        return response.ok({
            status: 'success',
            data: shifts,
        })
    }
}

