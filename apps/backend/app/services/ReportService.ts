import Attendance from '#models/attendance'
import Employee from '#models/employee'
import Department from '#models/department'
import Holiday from '#models/holiday'
import { DateTime } from 'luxon'

export default class ReportService {
  private parseIsoDate(value: string): DateTime {
    const parsed = DateTime.fromISO(String(value || '').trim())
    if (!parsed.isValid) {
      throw new Error('Invalid date value')
    }
    return parsed.startOf('day')
  }

  private toSqlDate(value: DateTime): string {
    return value.toISODate() || value.toFormat('yyyy-MM-dd')
  }

  private formatTime(value: DateTime | null | undefined): string | null {
    return value ? value.toFormat('HH:mm:ss') : null
  }

  private normalizeEmployeeName(employee: Employee | null | undefined): string {
    if (!employee) return 'Unknown'
    return `${employee.firstName} ${employee.lastName || ''}`.trim() || 'Unknown'
  }

  private normalizeDepartmentName(employee: Employee | null | undefined): string {
    return employee?.department?.departmentName || 'General'
  }

  private mapAttendanceRecord(att: Attendance) {
    return {
      id: att.id,
      employeeId: att.employeeId,
      employeeName: this.normalizeEmployeeName(att.employee),
      employeeCode: att.employee?.employeeCode || 'N/A',
      department: this.normalizeDepartmentName(att.employee),
      avatar: att.employee?.avatar || null,
      date: this.toSqlDate(att.attendanceDate),
      checkInTime: this.formatTime(att.checkIn),
      checkOutTime: this.formatTime(att.checkOut),
      status: att.status,
      lateMinutes: att.isLate ? 15 : 0,
      overtimeMinutes: att.isOvertime ? 60 : 0,
      workHours: Number(att.netWorkHours || att.workHours || 0),
      breakMinutes: att.totalBreakMin || 0,
    }
  }

  /**
   * Get attendance dashboard data for analytics hubs
   */
  async getAttendanceDashboard(
    orgId: number,
    filters: {
      startDate?: string
      endDate?: string
      status?: string
      departmentId?: number
      employeeId?: number
    } = {}
  ) {
    const now = DateTime.now()
    const start = filters.startDate ? DateTime.fromISO(filters.startDate) : now.startOf('month')
    const end = filters.endDate ? DateTime.fromISO(filters.endDate) : now.endOf('month')
    const startDate = start.toJSDate()
    const endDate = end.toJSDate()

    const query = Attendance.query()
      .where('org_id', orgId)
      .whereBetween('attendance_date', [startDate, endDate])
      .preload('employee', (q) => {
        q.select('id', 'first_name', 'last_name', 'employee_code', 'department_id', 'avatar')
        q.preload('department', (dq) => dq.select('id', 'department_name'))
      })
      .orderBy('attendance_date', 'desc')
      .orderBy('employee_id', 'asc')

    if (filters.employeeId) {
      query.where('employee_id', filters.employeeId)
    }
    if (filters.status) {
      query.where('status', filters.status as any)
    }

    const records = await query
    let filteredRecords = records

    if (filters.departmentId) {
      filteredRecords = records.filter((record) => record.employee?.departmentId === filters.departmentId)
    }

    const mappedRecords = filteredRecords.map((att) => this.mapAttendanceRecord(att))

    const summary = mappedRecords.reduce(
      (acc, record) => {
        acc.totalRecords += 1
        acc.totalWorkHours += record.workHours || 0

        switch (record.status) {
          case 'present':
            acc.present += 1
            break
          case 'late':
            acc.late += 1
            break
          case 'absent':
            acc.absent += 1
            break
          case 'half_day':
            acc.halfDay += 1
            break
          case 'on_leave':
            acc.onLeave += 1
            break
          case 'holiday':
            acc.holiday += 1
            break
          case 'weekend':
            acc.weekend += 1
            break
        }

        return acc
      },
      {
        totalRecords: 0,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
        holiday: 0,
        weekend: 0,
        totalWorkHours: 0,
      },
    )

    const totalRecords = summary.totalRecords || 1
    const averageWorkHours = summary.totalRecords > 0 ? summary.totalWorkHours / summary.totalRecords : 0
    const attendancePercentage = summary.totalRecords > 0
      ? Math.round(((summary.present + summary.late + summary.halfDay + summary.onLeave) / summary.totalRecords) * 100)
      : 0

    const leaderboardMap = new Map<number, any>()
    mappedRecords.forEach((record) => {
      const existing = leaderboardMap.get(record.employeeId) || {
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        employeeCode: record.employeeCode,
        department: record.department,
        avatar: record.avatar,
        records: 0,
        present: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
        totalWorkHours: 0,
        latestDate: record.date,
      }

      existing.records += 1
      existing.totalWorkHours += record.workHours || 0
      if (record.status === 'present') existing.present += 1
      if (record.status === 'late') existing.late += 1
      if (record.status === 'half_day') existing.halfDay += 1
      if (record.status === 'on_leave') existing.onLeave += 1
      if (record.date > existing.latestDate) existing.latestDate = record.date

      leaderboardMap.set(record.employeeId, existing)
    })

    const leaderboard = Array.from(leaderboardMap.values())
      .sort((a, b) => b.totalWorkHours - a.totalWorkHours || b.records - a.records)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        averageWorkHours: item.records > 0 ? Math.round((item.totalWorkHours / item.records) * 100) / 100 : 0,
        totalWorkHours: Math.round(item.totalWorkHours * 100) / 100,
      }))

    const statusBreakdown = [
      { status: 'present', label: 'Present' },
      { status: 'late', label: 'Late' },
      { status: 'absent', label: 'Absent' },
      { status: 'half_day', label: 'Half Day' },
      { status: 'on_leave', label: 'On Leave' },
      { status: 'holiday', label: 'Holiday' },
      { status: 'weekend', label: 'Weekend' },
    ].map((item) => {
      const statusCountMap: Record<string, number> = {
        present: summary.present,
        late: summary.late,
        absent: summary.absent,
        half_day: summary.halfDay,
        on_leave: summary.onLeave,
        holiday: summary.holiday,
        weekend: summary.weekend,
      }
      const count = statusCountMap[item.status] || 0
      return {
        ...item,
        count,
        percent: Math.max(0, Math.min(100, Math.round((count / totalRecords) * 100))),
      }
    })

    const departmentMap = new Map<string, { departmentId: number | null; departmentName: string; count: number; totalWorkHours: number; present: number; late: number; halfDay: number; onLeave: number }>()
    mappedRecords.forEach((record, index) => {
      const source = filteredRecords[index]
      const departmentName = record.department || 'General'
      const departmentId = source.employee?.departmentId || null
      const existing = departmentMap.get(departmentName) || {
        departmentId,
        departmentName,
        count: 0,
        totalWorkHours: 0,
        present: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
      }

      existing.count += 1
      existing.totalWorkHours += record.workHours || 0
      if (record.status === 'present') existing.present += 1
      if (record.status === 'late') existing.late += 1
      if (record.status === 'half_day') existing.halfDay += 1
      if (record.status === 'on_leave') existing.onLeave += 1

      departmentMap.set(departmentName, existing)
    })

    const departmentBreakdown = Array.from(departmentMap.values())
      .map((item) => ({
        ...item,
        averageWorkHours: item.count > 0 ? Math.round((item.totalWorkHours / item.count) * 100) / 100 : 0,
        totalWorkHours: Math.round(item.totalWorkHours * 100) / 100,
        percent: Math.max(0, Math.min(100, Math.round((item.count / totalRecords) * 100))),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      range: {
        startDate: start.toISODate(),
        endDate: end.toISODate(),
      },
      summary: {
        ...summary,
        totalWorkHours: Math.round(summary.totalWorkHours * 100) / 100,
        averageWorkHours: Math.round(averageWorkHours * 100) / 100,
        attendancePercentage,
      },
      records: mappedRecords,
      leaderboard,
      statusBreakdown,
      departmentBreakdown,
      recentRecords: mappedRecords.slice(0, 10),
    }
  }

  /**
   * Get daily attendance report
   */
  async getDailyReport(orgId: number, date: string, departmentId?: number) {
    const targetDate = this.parseIsoDate(date)
    const today = DateTime.now().startOf('day')
    const dayOfWeek = targetDate.weekday // 1 = Monday, 7 = Sunday

    // Build employee query
    const employeeQuery = Employee.query()
      .where('org_id', orgId)
      .where('status', 'active')

    if (departmentId) {
      employeeQuery.where('department_id', departmentId)
    }

    const employees = await employeeQuery

    if (targetDate > today) {
      const totalEmployees = employees.length
      const isWeekend = dayOfWeek >= 6

      return {
        date: this.toSqlDate(targetDate),
        totalEmployees,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
        holidays: 0,
        weekend: isWeekend ? totalEmployees : 0,
        attendancePercentage: 0
      }
    }

    // Get attendance for the date
    const attendanceRecords = await Attendance.query()
      .where('org_id', orgId)
      .where('attendance_date', this.toSqlDate(targetDate))
      .preload('employee', (query) => {
        query.select('id', 'first_name', 'last_name', 'employee_code', 'department_id')
        query.preload('department', (q) => q.select('id', 'department_name'))
      })

    // Get holidays for the organization
    const holidays = await Holiday.query()
      .where('org_id', orgId)
      .where('holiday_date', this.toSqlDate(targetDate))

    const isHoliday = holidays.length > 0
    const isWeekend = dayOfWeek >= 6 // Saturday or Sunday

    const attendanceMap = new Map()
    attendanceRecords.forEach((att) => {
      attendanceMap.set(att.employeeId, att)
    })

    let present = 0
    let absent = 0
    let late = 0
    let halfDay = 0
    let onLeave = 0

    employees.forEach((emp) => {
      const att = attendanceMap.get(emp.id)
      if (!att) {
        // No attendance record
        if (isHoliday) {
          // Holiday - don't count as absent
        } else if (isWeekend) {
          // Weekend - don't count as absent
        } else {
          absent++
        }
      } else {
        switch (att.status) {
          case 'present':
            present++
            break
          case 'absent':
            absent++
            break
          case 'late':
            late++
            break
          case 'half_day':
            halfDay++
            break
          case 'on_leave':
            onLeave++
            break
          case 'holiday':
            // Holiday status
            break
          case 'weekend':
            // Weekend status
            break
        }
      }
    })

    const totalEmployees = employees.length
    const attendancePercentage = totalEmployees > 0 
      ? Math.round(((present + late + halfDay + onLeave) / totalEmployees) * 100) 
      : 0

    return {
      date: this.toSqlDate(targetDate),
      totalEmployees,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      holidays: isHoliday ? 1 : 0,
      weekend: isWeekend ? (totalEmployees - present - absent - late - halfDay - onLeave) : 0,
      attendancePercentage
    }
  }

  /**
   * Get monthly attendance report
   */
  async getMonthlyReport(orgId: number, year: number, month: number, departmentId?: number, employeeId?: number) {
    const startDate = DateTime.fromObject({ year, month, day: 1 })
    const endDate = endOfMonth(startDate)

    // Get all days in the month
    const totalDays = endDate.day

    // Count working days (excluding weekends)
    let workingDays = 0
    for (let d = startDate; d <= endDate; d = d.plus({ days: 1 })) {
      if (d.weekday <= 5) workingDays++
    }

    // Get holidays in the month
    const holidays = await Holiday.query()
      .where('org_id', orgId)
      .whereBetween('holiday_date', [this.toSqlDate(startDate), this.toSqlDate(endDate)])

    workingDays -= holidays.length // Subtract holidays from working days

    // Build employee query
    const employeeQuery = Employee.query()
      .where('org_id', orgId)
      .where('status', 'active')

    if (departmentId) {
      employeeQuery.where('department_id', departmentId)
    }
    if (employeeId) {
      employeeQuery.where('id', employeeId)
    }

    const employees = await employeeQuery.preload('department')

    // Get attendance records for the month
    const attendanceRecords = await Attendance.query()
      .where('org_id', orgId)
      .whereBetween('attendance_date', [this.toSqlDate(startDate), this.toSqlDate(endDate)])
      .preload('employee')

    // Group attendance by employee
    const attendanceByEmployee = new Map()
    attendanceRecords.forEach((att) => {
      if (!attendanceByEmployee.has(att.employeeId)) {
        attendanceByEmployee.set(att.employeeId, [])
      }
      attendanceByEmployee.get(att.employeeId).push(att)
    })

    const employeeReports: any[] = []

    employees.forEach((emp) => {
      const empAttendance = attendanceByEmployee.get(emp.id) || []

      let present = 0
      let absent = 0
      let late = 0
      let halfDay = 0
      let onLeave = 0
      let totalWorkHours = 0

      empAttendance.forEach((att: any) => {
        switch (att.status) {
          case 'present':
            present++
            if (att.netWorkHours) totalWorkHours += Number(att.netWorkHours)
            break
          case 'absent':
            absent++
            break
          case 'late':
            late++
            if (att.netWorkHours) totalWorkHours += Number(att.netWorkHours)
            break
          case 'half_day':
            halfDay++
            break
          case 'on_leave':
            onLeave++
            break
        }
      })

      const empWorkDays = workingDays
      const empPresentDays = present + late + halfDay + onLeave
      const attendancePercentage = empWorkDays > 0 
        ? Math.round((empPresentDays / empWorkDays) * 100) 
        : 0

      employeeReports.push({
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName || ''}`.trim(),
        employeeCode: emp.employeeCode,
        department: emp.department?.departmentName || 'General',
        present,
        absent,
        late,
        halfDay,
        onLeave,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        overtimeHours: 0, // Calculate if needed
        lateMinutes: late * 15, // Approximate
        attendancePercentage
      })
    })

    const totalPresent = employeeReports.reduce((sum, r) => sum + r.present, 0)
    const totalLate = employeeReports.reduce((sum, r) => sum + r.late, 0)
    const totalHalfDay = employeeReports.reduce((sum, r) => sum + r.halfDay, 0)
    const totalOnLeave = employeeReports.reduce((sum, r) => sum + r.onLeave, 0)

    const averageAttendance = employees.length > 0
      ? Math.round(employeeReports.reduce((sum, r) => sum + r.attendancePercentage, 0) / employees.length)
      : 0

    return {
      month,
      year,
      totalDays,
      workingDays,
      present: totalPresent,
      absent: workingDays * employees.length - totalPresent - totalLate - totalHalfDay - totalOnLeave,
      late: totalLate,
      halfDay: totalHalfDay,
      onLeave: totalOnLeave,
      averageAttendance,
      totalOvertimeHours: 0,
      employeeReports
    }
  }

  /**
   * Get attendance report for a date range
   */
  async getAttendanceReport(
    orgId: number,
    startDate: string,
    endDate: string,
    departmentId?: number,
    employeeId?: number,
    status?: string
  ) {
    const start = this.parseIsoDate(startDate)
    const end = this.parseIsoDate(endDate)

    const query = Attendance.query()
      .where('org_id', orgId)
      .whereBetween('attendance_date', [this.toSqlDate(start), this.toSqlDate(end)])
      .preload('employee', (q) => {
        q.preload('department', (dq) => dq.select('id', 'department_name'))
      })
      .orderBy('attendance_date', 'desc')
      .orderBy('employee_id', 'asc')

    if (employeeId) {
      query.where('employee_id', employeeId)
    }

    if (status) {
      query.where('status', status)
    }

    const records = await query

    // Filter by department after loading
    let filteredRecords = records
    if (departmentId) {
      filteredRecords = records.filter((r) => r.employee?.departmentId === departmentId)
    }

    return filteredRecords.map((att) => ({
      id: att.id,
      employeeId: att.employeeId,
      employeeName: att.employee ? `${att.employee.firstName} ${att.employee.lastName || ''}`.trim() : 'Unknown',
      employeeCode: att.employee?.employeeCode || 'N/A',
      department: att.employee?.department?.departmentName || 'General',
      date: this.toSqlDate(att.attendanceDate),
      checkInTime: this.formatTime(att.checkIn),
      checkOutTime: this.formatTime(att.checkOut),
      status: att.status,
      lateMinutes: att.isLate ? 15 : 0, // Approximate
      overtimeMinutes: att.isOvertime ? 60 : 0, // Approximate
      workHours: att.netWorkHours || 0,
      breakMinutes: att.totalBreakMin || 0
    }))
  }

  /**
   * Get late arrival report
   */
  async getLateArrivals(
    orgId: number,
    startDate: string,
    endDate: string,
    departmentId?: number,
    employeeId?: number
  ) {
    const start = this.parseIsoDate(startDate)
    const end = this.parseIsoDate(endDate)

    const query = Attendance.query()
      .where('org_id', orgId)
      .where('is_late', true)
      .whereBetween('attendance_date', [this.toSqlDate(start), this.toSqlDate(end)])
      .preload('employee', (q) => {
        q.preload('department', (dq) => dq.select('id', 'department_name'))
      })
      .orderBy('attendance_date', 'desc')

    if (employeeId) {
      query.where('employee_id', employeeId)
    }

    const records = await query

    let filteredRecords = records
    if (departmentId) {
      filteredRecords = records.filter((r) => r.employee?.departmentId === departmentId)
    }

    return filteredRecords.map((att) => ({
      employeeId: att.employeeId,
      employeeName: att.employee ? `${att.employee.firstName} ${att.employee.lastName || ''}`.trim() : 'Unknown',
      employeeCode: att.employee?.employeeCode || 'N/A',
      department: att.employee?.department?.departmentName || 'General',
      date: this.toSqlDate(att.attendanceDate),
      checkInTime: this.formatTime(att.checkIn) || '--:--:--',
      scheduledTime: '09:00:00', // Default, could be dynamic based on shift
      lateMinutes: 15 // Approximate, could be calculated from shift
    }))
  }

  /**
   * Get absent report
   */
  async getAbsentReport(
    orgId: number,
    startDate: string,
    endDate: string,
    departmentId?: number,
    employeeId?: number
  ) {
    const start = this.parseIsoDate(startDate)
    const end = this.parseIsoDate(endDate)

    // Get all active employees
    const employeeQuery = Employee.query()
      .where('org_id', orgId)
      .where('status', 'active')

    if (departmentId) {
      employeeQuery.where('department_id', departmentId)
    }
    if (employeeId) {
      employeeQuery.where('id', employeeId)
    }

    const employees = await employeeQuery.preload('department')

    // Get attendance records for the date range
    const attendanceRecords = await Attendance.query()
      .where('org_id', orgId)
      .whereBetween('attendance_date', [this.toSqlDate(start), this.toSqlDate(end)])
      .where('status', 'absent')

    // Get holidays
    const holidays = await Holiday.query()
      .where('org_id', orgId)
      .whereBetween('holiday_date', [this.toSqlDate(start), this.toSqlDate(end)])

    const holidayDates = new Set(holidays.map((h) => this.toSqlDate(h.holidayDate)))
    const absentMap = new Map()

    attendanceRecords.forEach((att) => {
      if (!absentMap.has(att.employeeId)) {
        absentMap.set(att.employeeId, new Set())
      }
      absentMap.get(att.employeeId).add(att.attendanceDate)
    })

    const result: any[] = []

    // For each employee, check each day in the range
    for (let d = start; d <= end; d = d.plus({ days: 1 })) {
      const dateStr = this.toSqlDate(d)
      const dayOfWeek = d.weekday

      // Skip weekends
      if (dayOfWeek >= 6) continue

      // Skip holidays
      if (holidayDates.has(dateStr)) continue

      employees.forEach((emp) => {
        const empAbsentDates = absentMap.get(emp.id)
        if (empAbsentDates && empAbsentDates.has(dateStr)) {
          result.push({
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName || ''}`.trim(),
            employeeCode: emp.employeeCode || 'N/A',
            department: emp.department?.departmentName || 'General',
            date: dateStr,
            status: 'absent',
            reason: ''
          })
        }
      })
    }

    return result
  }

  /**
   * Get attendance summary
   */
  async getSummary(orgId: number, year: number, month: number) {
    return this.getMonthlyReport(orgId, year, month)
  }

  /**
   * Get weekly attendance for charts
   */
  async getWeeklyAttendance(orgId: number) {
    const today = DateTime.now()
    const weekStart = today.minus({ days: 6 })

    const data = []
    for (let d = weekStart; d <= today; d = d.plus({ days: 1 })) {
      const dayReport = await this.getDailyReport(orgId, d.toISODate())
      data.push({
        date: this.toSqlDate(d),
        dayName: d.toFormat('EEE'),
        present: dayReport.present,
        absent: dayReport.absent,
        late: dayReport.late,
        onLeave: dayReport.onLeave
      })
    }

    return data
  }

  /**
   * Get department-wise attendance
   */
  async getDepartmentWiseAttendance(orgId: number, year: number, month: number) {
    const departments = await Department.query().where('org_id', orgId)

    const result = []

    for (const dept of departments) {
      const report = await this.getMonthlyReport(orgId, year, month, dept.id)
      result.push({
        departmentId: dept.id,
        departmentName: dept.departmentName,
        totalEmployees: report.employeeReports.length,
        present: report.present,
        absent: report.absent,
        late: report.late,
        halfDay: report.halfDay,
        onLeave: report.onLeave,
        averageAttendance: report.averageAttendance
      })
    }

    return result
  }
}

// Helper function to get end of month
function endOfMonth(date: DateTime): DateTime {
  return date.endOf('month')
}
