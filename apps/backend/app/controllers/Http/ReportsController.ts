import { HttpContext } from '@adonisjs/core/http'
import ReportService from '#services/ReportService'
import { inject } from '@adonisjs/core'

@inject()
export default class ReportsController {
  constructor(protected reportService: ReportService) { }

  /**
   * Get daily attendance report
   * GET /api/reports/daily?date=2026-01-15&departmentId=1
   */
  async getDailyReport({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const date = request.input('date', new Date().toISOString().split('T')[0])
    const departmentId = request.input('departmentId')

    try {
      const report = await this.reportService.getDailyReport(user.orgId, date, departmentId)
      return response.ok({ data: report })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get monthly attendance report
   * GET /api/reports/monthly?year=2026&month=1&departmentId=1&employeeId=1
   */
  async getMonthlyReport({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const year = parseInt(request.input('year', new Date().getFullYear().toString()))
    const month = parseInt(request.input('month', (new Date().getMonth() + 1).toString()))
    const departmentId = request.input('departmentId')
    const employeeId = request.input('employeeId')

    try {
      const report = await this.reportService.getMonthlyReport(
        user.orgId,
        year,
        month,
        departmentId,
        employeeId
      )
      return response.ok({ data: report })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get attendance report for a date range
   * GET /api/reports/attendance?startDate=2026-01-01&endDate=2026-01-31&departmentId=1&employeeId=1&status=present
   */
  async getAttendanceReport({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const departmentId = request.input('departmentId')
    const employeeId = request.input('employeeId')
    const status = request.input('status')

    if (!startDate || !endDate) {
      return response.badRequest({ message: 'startDate and endDate are required' })
    }

    try {
      const report = await this.reportService.getAttendanceReport(
        user.orgId,
        startDate,
        endDate,
        departmentId,
        employeeId,
        status
      )
      return response.ok({ data: report })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get late arrival report
   * GET /api/reports/late?startDate=2026-01-01&endDate=2026-01-31&departmentId=1&employeeId=1
   */
  async getLateArrivals({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const departmentId = request.input('departmentId')
    const employeeId = request.input('employeeId')

    if (!startDate || !endDate) {
      return response.badRequest({ message: 'startDate and endDate are required' })
    }

    try {
      const report = await this.reportService.getLateArrivals(
        user.orgId,
        startDate,
        endDate,
        departmentId,
        employeeId
      )
      return response.ok({ data: report })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get absent report
   * GET /api/reports/absent?startDate=2026-01-01&endDate=2026-01-31&departmentId=1&employeeId=1
   */
  async getAbsentReport({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const departmentId = request.input('departmentId')
    const employeeId = request.input('employeeId')

    if (!startDate || !endDate) {
      return response.badRequest({ message: 'startDate and endDate are required' })
    }

    try {
      const report = await this.reportService.getAbsentReport(
        user.orgId,
        startDate,
        endDate,
        departmentId,
        employeeId
      )
      return response.ok({ data: report })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get attendance summary
   * GET /api/reports/summary?year=2026&month=1
   */
  async getSummary({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const year = parseInt(request.input('year', new Date().getFullYear().toString()))
    const month = parseInt(request.input('month', (new Date().getMonth() + 1).toString()))

    try {
      const summary = await this.reportService.getSummary(user.orgId, year, month)
      return response.ok({ data: summary })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get attendance dashboard data
   * GET /api/reports/attendance-dashboard?startDate=2026-01-01&endDate=2026-01-31&status=present&departmentId=1
   */
  async getAttendanceDashboard({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const departmentId = request.input('departmentId')
    const employeeId = request.input('employeeId')
    const status = request.input('status')

    try {
      const dashboard = await this.reportService.getAttendanceDashboard(user.orgId, {
        startDate,
        endDate,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        employeeId: employeeId ? parseInt(employeeId) : undefined,
        status: status || undefined,
      })

      return response.ok({ data: dashboard })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get weekly attendance for charts
   * GET /api/reports/weekly
   */
  async getWeeklyAttendance({ auth, response }: HttpContext) {
    const user = auth.user!

    try {
      const data = await this.reportService.getWeeklyAttendance(user.orgId)
      return response.ok({ data })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Get department-wise attendance
   * GET /api/reports/by-department?year=2026&month=1
   */
  async getDepartmentWiseAttendance({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const year = parseInt(request.input('year', new Date().getFullYear().toString()))
    const month = parseInt(request.input('month', (new Date().getMonth() + 1).toString()))

    try {
      const data = await this.reportService.getDepartmentWiseAttendance(user.orgId, year, month)
      return response.ok({ data })
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Export to Excel
   * GET /api/reports/export/excel?startDate=2026-01-01&endDate=2026-01-31
   */
  async exportExcel({ auth, request, response }: HttpContext) {
    const user = auth.user!
    const startDate = request.input('startDate')
    const endDate = request.input('endDate')
    const departmentId = request.input('departmentId')
    const employeeId = request.input('employeeId')
    const status = request.input('status')

    if (!startDate || !endDate) {
      return response.badRequest({ message: 'startDate and endDate are required' })
    }

    try {
      const data = await this.reportService.getAttendanceReport(
        user.orgId,
        startDate,
        endDate,
        departmentId,
        employeeId,
        status
      )

      // Generate CSV content (simple Excel-compatible format)
      const headers = ['Employee Name', 'Employee Code', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Work Hours']
      const rows = data.map((row: any) => [
        row.employeeName,
        row.employeeCode,
        row.department,
        row.date,
        row.checkInTime || 'N/A',
        row.checkOutTime || 'N/A',
        row.status,
        row.workHours
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n')

      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', 'attachment; filename="attendance_report.csv"')
      return response.send(csvContent)
    } catch (error) {
      return response.internalServerError({ message: error.message })
    }
  }

  /**
   * Export to PDF (returns CSV for now)
   * GET /api/reports/export/pdf?startDate=2026-01-01&endDate=2026-01-31
   */
  async exportPdf({ auth, request, response }: HttpContext) {
    // For now, just redirect to Excel export
    // In production, you'd use a PDF library
    return this.exportExcel({ auth, request, response } as any)
  }
}
