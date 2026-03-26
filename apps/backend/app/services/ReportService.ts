import Attendance from '#models/attendance'
import Employee from '#models/employee'
import Department from '#models/department'
import Holiday from '#models/holiday'
import { DateTime } from 'luxon'

export default class ReportService {
  /**
   * Get daily attendance report
   */
  async getDailyReport(orgId: number, date: string, departmentId?: number) {
    const targetDate = DateTime.fromISO(date)
    const dayOfWeek = targetDate.weekday // 1 = Monday, 7 = Sunday

    // Build employee query
    const employeeQuery = Employee.query()
      .where('org_id', orgId)
      .where('status', 'active')

    if (departmentId) {
      employeeQuery.where('department_id', departmentId)
    }

    const employees = await employeeQuery

    // Get attendance for the date
    const attendanceRecords = await Attendance.query()
      .where('org_id', orgId)
      .where('attendance_date', targetDate.toISODate())
      .preload('employee', (query) => {
        query.select('id', 'first_name', 'last_name', 'employee_code', 'department_id')
        query.preload('department', (q) => q.select('id', 'department_name'))
      })

    // Get holidays for the organization
    const holidays = await Holiday.query()
      .where('org_id', orgId)
      .where('holiday_date', targetDate.toISODate())

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
      date: targetDate.toISODate(),
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
      .whereBetween('holiday_date', [startDate.toISODate(), endDate.toISODate()])

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
      .whereBetween('attendance_date', [startDate.toISODate(), endDate.toISODate()])
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
    const start = DateTime.fromISO(startDate)
    const end = DateTime.fromISO(endDate)

    const query = Attendance.query()
      .where('org_id', orgId)
      .whereBetween('attendance_date', [start.toISODate(), end.toISODate()])
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
      date: att.attendanceDate,
      checkInTime: att.checkIn ? DateTime.fromJSDate(att.checkIn).toFormat('HH:mm:ss') : null,
      checkOutTime: att.checkOut ? DateTime.fromJSDate(att.checkOut).toFormat('HH:mm:ss') : null,
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
    const start = DateTime.fromISO(startDate)
    const end = DateTime.fromISO(endDate)

    const query = Attendance.query()
      .where('org_id', orgId)
      .where('is_late', true)
      .whereBetween('attendance_date', [start.toISODate(), end.toISODate()])
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
      date: att.attendanceDate,
      checkInTime: att.checkIn ? DateTime.fromJSDate(att.checkIn).toFormat('HH:mm:ss') : '--:--:--',
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
    const start = DateTime.fromISO(startDate)
    const end = DateTime.fromISO(endDate)

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
      .whereBetween('attendance_date', [start.toISODate(), end.toISODate()])
      .where('status', 'absent')

    // Get holidays
    const holidays = await Holiday.query()
      .where('org_id', orgId)
      .whereBetween('holiday_date', [start.toISODate(), end.toISODate()])

    const holidayDates = new Set(holidays.map(h => h.holidayDate))
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
      const dateStr = d.toISODate()
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
        date: d.toISODate(),
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
