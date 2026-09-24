import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import AttendanceService from '#services/AttendanceService'
import LeaveAccrualService from '#services/LeaveAccrualService'
import PdfService from '#services/PdfService'
import EmployeeImportService from '#services/EmployeeImportService'

test.group('Advanced Modules Spec', () => {
  test('evaluates attendance roster late minutes and half day correctly', async ({ assert }) => {
    // Check-in at 09:30 (Grace is 15 min -> Expected start 09:15 -> Late by 15 mins)
    const checkIn = DateTime.fromISO('2026-09-24T09:30:00')
    const checkOut = DateTime.fromISO('2026-09-24T18:00:00')

    const metrics = AttendanceService.calculateRosterMetrics(checkIn, checkOut, '09:00', '18:00', 15)

    assert.equal(metrics.lateMinutes, 15)
    assert.equal(metrics.earlyExitMinutes, 0)
    assert.equal(metrics.status, 'late')
    assert.isFalse(metrics.isHalfDay)
  })

  test('calculates Sandwich Rule weekend inclusion on leave requests', async ({ assert }) => {
    const friday = DateTime.fromISO('2026-09-25') // Friday
    const monday = DateTime.fromISO('2026-09-28') // Monday

    const result = LeaveAccrualService.calculateSandwichLeaveDays(friday, monday, [])

    assert.equal(result.totalDays, 4) // Fri, Sat, Sun, Mon
    assert.isTrue(result.isSandwiched)
    assert.equal(result.holidayDaysIncluded, 2) // Sat + Sun
  })

  test('generates branded HTML payslip with accurate earnings and net pay', async ({ assert }) => {
    const html = PdfService.generatePayslipHtml({
      orgName: 'Acme Corp',
      employeeName: 'Nikhil Kushwah',
      employeeCode: 'EMP-01',
      designation: 'Senior Engineer',
      department: 'Engineering',
      pan: 'ABCDE1234F',
      bankAccount: '1234567890',
      ifsc: 'SBIN0001234',
      payPeriod: 'September 2026',
      workingDays: 30,
      paidDays: 30,
      earnings: {
        basic: 40000,
        hra: 20000,
        allowances: 15000,
        bonus: 0,
        gross: 75000,
      },
      deductions: {
        pf: 1800,
        esi: 0,
        pt: 200,
        tds: 2000,
        total: 4000,
      },
      netPayable: 71000,
    })

    assert.include(html, 'Acme Corp')
    assert.include(html, 'Nikhil Kushwah')
    assert.include(html, '71,000')
  })

  test('calculates Full & Final (F&F) settlement with Gratuity and Notice recovery', async ({ assert }) => {
    const settlement = EmployeeImportService.calculateFnFSettlement({
      basicSalary: 30000,
      unpaidWorkDays: 10,
      totalWorkingDaysInMonth: 30,
      encashableLeaveDays: 15,
      gratuityYearsCompleted: 5,
      noticePeriodShortfallDays: 0,
    })

    assert.equal(settlement.unpaidSalaryAmount, 10000)
    assert.equal(settlement.leaveEncashmentAmount, 15000)
    // Gratuity for 5 years: (15 * 30000 * 5) / 26 = 86538
    assert.equal(settlement.gratuityAmount, 86538)
    assert.equal(settlement.netSettlement, 111538)
  })
})
