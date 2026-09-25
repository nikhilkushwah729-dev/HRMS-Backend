export interface SettlementInput {
  basicSalary: number
  unpaidWorkDays: number
  totalWorkingDaysInMonth: number
  encashableLeaveDays: number
  gratuityYearsCompleted: number
  noticePeriodShortfallDays: number
}

export interface SettlementResult {
  unpaidSalaryAmount: number
  leaveEncashmentAmount: number
  gratuityAmount: number
  noticeDeductionAmount: number
  grossSettlement: number
  netSettlement: number
}

export default class FullFinalSettlementService {
  /**
   * Full & Final (F&F) Settlement Calculator
   * Gratuity Formula (Gratuity Act 1972): (15 * Last Drawn Basic * Years Completed) / 26
   * Leave Encashment: (Basic / 30) * Encashable Days
   */
  static calculateFnFSettlement(input: SettlementInput): SettlementResult {
    const dailyBasic = input.basicSalary / (input.totalWorkingDaysInMonth || 30)

    // 1. Unpaid Salary for current month
    const unpaidSalaryAmount = Math.round(dailyBasic * input.unpaidWorkDays)

    // 2. Leave Encashment
    const leaveEncashmentAmount = Math.round(dailyBasic * input.encashableLeaveDays)

    // 3. Gratuity (if >= 5 years completed)
    let gratuityAmount = 0
    if (input.gratuityYearsCompleted >= 5) {
      gratuityAmount = Math.round((15 * input.basicSalary * input.gratuityYearsCompleted) / 26)
    }

    // 4. Notice Period Recovery
    const noticeDeductionAmount = Math.round(dailyBasic * input.noticePeriodShortfallDays)

    const grossSettlement = unpaidSalaryAmount + leaveEncashmentAmount + gratuityAmount
    const netSettlement = Math.max(0, grossSettlement - noticeDeductionAmount)

    return {
      unpaidSalaryAmount,
      leaveEncashmentAmount,
      gratuityAmount,
      noticeDeductionAmount,
      grossSettlement,
      netSettlement,
    }
  }
}
