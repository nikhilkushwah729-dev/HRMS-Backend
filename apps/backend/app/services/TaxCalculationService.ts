export interface StatutoryCalculationInput {
  basicSalary: number
  hra?: number
  allowances?: number
  bonus?: number
  grossSalary: number
  state?: string
  gender?: 'male' | 'female' | 'other'
  restrictPfToCeiling?: boolean
  isDisabled?: boolean
}

export interface StatutoryCalculationOutput {
  pf: {
    employeePF: number
    employerEPF: number
    employerEPS: number
    employerEDLI: number
    adminCharges: number
    totalEmployerPF: number
  }
  esi: {
    employeeESI: number
    employerESI: number
  }
  professionalTax: number
  tds: {
    annualGross: number
    standardDeduction: number
    taxableIncome: number
    annualTax: number
    monthlyTDS: number
  }
  totalEmployeeDeductions: number
  netSalary: number
}

export default class TaxCalculationService {
  /**
   * Calculate Employees' Provident Fund (EPF)
   * Stat ceiling: ₹15,000 basic wage
   */
  static calculatePF(basicSalary: number, restrictToCeiling: boolean = true) {
    const pfWage = restrictToCeiling ? Math.min(basicSalary, 15000) : basicSalary

    const employeePF = Math.round(pfWage * 0.12)
    const epsContribution = Math.min(Math.round(Math.min(basicSalary, 15000) * 0.0833), 1250)
    const epfEmployerContribution = Math.max(0, Math.round(pfWage * 0.12) - epsContribution)
    const edliContribution = Math.min(Math.round(pfWage * 0.005), 75)
    const adminCharges = Math.round(pfWage * 0.005)

    return {
      employeePF,
      employerEPF: epfEmployerContribution,
      employerEPS: epsContribution,
      employerEDLI: edliContribution,
      adminCharges,
      totalEmployerPF: epfEmployerContribution + epsContribution + edliContribution + adminCharges,
    }
  }

  /**
   * Calculate Employees' State Insurance (ESI)
   * Stat ceiling: ₹21,000 gross monthly wage (₹25,000 for disability)
   */
  static calculateESI(grossSalary: number, isDisabled: boolean = false) {
    const limit = isDisabled ? 25000 : 21000
    if (grossSalary > limit) {
      return { employeeESI: 0, employerESI: 0 }
    }

    const employeeESI = Math.ceil(grossSalary * 0.0075)
    const employerESI = Math.ceil(grossSalary * 0.0325)

    return { employeeESI, employerESI }
  }

  /**
   * Calculate State Professional Tax (PT)
   */
  static calculateProfessionalTax(
    grossSalary: number,
    state: string = 'Maharashtra',
    gender: string = 'male',
    monthIndex: number = 0 // 0-indexed month (1 = Feb)
  ): number {
    const normalizedState = String(state || '').trim().toLowerCase()

    if (normalizedState.includes('maharashtra')) {
      if (gender === 'female' && grossSalary <= 10000) return 0
      if (grossSalary <= 7500) return 0
      if (grossSalary <= 10000) return 175
      // Feb deduction is ₹300
      return monthIndex === 1 ? 300 : 200
    }

    if (normalizedState.includes('karnataka')) {
      return grossSalary >= 25000 ? 200 : 0
    }

    if (normalizedState.includes('telangana') || normalizedState.includes('andhra')) {
      if (grossSalary <= 15000) return 0
      if (grossSalary <= 20000) return 150
      return 200
    }

    if (normalizedState.includes('tamil nadu') || normalizedState.includes('tamilnadu')) {
      if (grossSalary <= 3500) return 0
      if (grossSalary <= 5000) return 20
      if (grossSalary <= 7500) return 50
      if (grossSalary <= 10000) return 115
      if (grossSalary <= 12500) return 170
      return 208
    }

    // Default fall-through for states with standard ₹200 PT
    return grossSalary >= 15000 ? 200 : 0
  }

  /**
   * Calculate Income Tax / TDS under New Tax Regime (FY 2024-25 / 2025-26 - Sec 115BAC)
   */
  static calculateNewRegimeTDS(monthlyGross: number): {
    annualGross: number
    standardDeduction: number
    taxableIncome: number
    annualTax: number
    monthlyTDS: number
  } {
    const annualGross = monthlyGross * 12
    const standardDeduction = 75000
    const taxableIncome = Math.max(0, annualGross - standardDeduction)

    // Sec 87A Rebate: Zero tax if taxable income <= ₹7,000,00
    if (taxableIncome <= 700000) {
      return {
        annualGross,
        standardDeduction,
        taxableIncome,
        annualTax: 0,
        monthlyTDS: 0,
      }
    }

    let tax = 0

    // Slabs:
    // 0 - 3L: 0%
    // 3L - 7L: 5% (max 20,000)
    // 7L - 10L: 10% (max 30,000)
    // 10L - 12L: 15% (max 30,000)
    // 12L - 15L: 20% (max 60,000)
    // > 15L: 30%

    if (taxableIncome > 300000) {
      tax += Math.min(taxableIncome - 300000, 400000) * 0.05
    }
    if (taxableIncome > 700000) {
      tax += Math.min(taxableIncome - 700000, 300000) * 0.10
    }
    if (taxableIncome > 1000000) {
      tax += Math.min(taxableIncome - 1000000, 200000) * 0.15
    }
    if (taxableIncome > 1200000) {
      tax += Math.min(taxableIncome - 1200000, 300000) * 0.20
    }
    if (taxableIncome > 1500000) {
      tax += (taxableIncome - 1500000) * 0.30
    }

    // 4% Health & Education Cess
    const cess = tax * 0.04
    const totalAnnualTax = Math.round(tax + cess)
    const monthlyTDS = Math.round(totalAnnualTax / 12)

    return {
      annualGross,
      standardDeduction,
      taxableIncome,
      annualTax: totalAnnualTax,
      monthlyTDS,
    }
  }

  /**
   * Complete Statutory Calculation Pipeline
   */
  static processStatutorySalary(input: StatutoryCalculationInput): StatutoryCalculationOutput {
    const pf = this.calculatePF(input.basicSalary, input.restrictPfToCeiling ?? true)
    const esi = this.calculateESI(input.grossSalary, input.isDisabled ?? false)
    const professionalTax = this.calculateProfessionalTax(input.grossSalary, input.state ?? 'Maharashtra', input.gender ?? 'male')
    const tds = this.calculateNewRegimeTDS(input.grossSalary)

    const totalEmployeeDeductions = pf.employeePF + esi.employeeESI + professionalTax + tds.monthlyTDS
    const netSalary = Math.max(0, input.grossSalary - totalEmployeeDeductions)

    return {
      pf,
      esi,
      professionalTax,
      tds,
      totalEmployeeDeductions,
      netSalary,
    }
  }
}
