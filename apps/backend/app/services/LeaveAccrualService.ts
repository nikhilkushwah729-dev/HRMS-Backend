import { DateTime } from 'luxon'
import LeaveType from '#models/leave_type'
import LeaveBalance from '#models/leave_balance'
import Employee from '#models/employee'

export default class LeaveAccrualService {
  /**
   * Calculate total leave days applying the Sandwich Rule.
   * If a leave request spans over weekends/holidays without working days intervening,
   * the intervening non-working days are counted as leave.
   */
  static calculateSandwichLeaveDays(
    startDate: DateTime,
    endDate: DateTime,
    holidayDates: string[] = []
  ): { totalDays: number; isSandwiched: boolean; holidayDaysIncluded: number } {
    let current = startDate
    let totalDays = 0
    let holidayDaysIncluded = 0
    const holidaySet = new Set(holidayDates)

    while (current <= endDate) {
      const isWeekend = current.weekday === 6 || current.weekday === 7
      const dateStr = current.toISODate()!
      const isHoliday = holidaySet.has(dateStr)

      totalDays++

      if (isWeekend || isHoliday) {
        holidayDaysIncluded++
      }

      current = current.plus({ days: 1 })
    }

    // Check Sandwich Rule condition: if leave starts on Fri and ends on Mon, Sat+Sun are sandwiched
    const startIsBeforeWeekend = startDate.weekday === 5 // Friday
    const endIsAfterWeekend = endDate.weekday === 1 // Monday
    const isSandwiched = holidayDaysIncluded > 0 && (startIsBeforeWeekend || endIsAfterWeekend || totalDays > 3)

    return {
      totalDays,
      isSandwiched,
      holidayDaysIncluded,
    }
  }

  /**
   * Monthly Leave Accrual Processor
   */
  static async processMonthlyAccrual(orgId: number) {
    const activeEmployees = await Employee.query()
      .where('org_id', orgId)
      .where('status', 'active')

    const leaveTypes = await LeaveType.query()
      .where('org_id', orgId)

    let accruedCount = 0

    for (const emp of activeEmployees) {
      for (const leaveType of leaveTypes) {
        const monthlyCredit = Number(leaveType.daysAllowed ?? 12) / 12

        let balance = await LeaveBalance.query()
          .where('employee_id', emp.id)
          .where('leave_type_id', leaveType.id)
          .first()

        if (!balance) {
          balance = new LeaveBalance()
          balance.employeeId = emp.id
          balance.leaveTypeId = leaveType.id
          balance.year = DateTime.now().year
          balance.totalDays = 0
          balance.usedDays = 0
          balance.remainingDays = 0
        }

        balance.totalDays = Math.round((balance.totalDays + monthlyCredit) * 100) / 100
        balance.remainingDays = Math.max(0, balance.totalDays - balance.usedDays)
        await balance.save()
        accruedCount++
      }
    }

    return { activeEmployees: activeEmployees.length, accruedRecords: accruedCount }
  }
}
