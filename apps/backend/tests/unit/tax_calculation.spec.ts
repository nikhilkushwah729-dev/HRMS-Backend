import { test } from '@japa/runner'
import TaxCalculationService from '#services/TaxCalculationService'

test.group('Tax Calculation Spec', () => {
  test('calculates PF accurately with ₹15,000 wage ceiling', async ({ assert }) => {
    const pf = TaxCalculationService.calculatePF(25000, true)

    assert.equal(pf.employeePF, 1800) // 12% of 15,000
    assert.equal(pf.employerEPS, 1250) // 8.33% of 15,000 capped at 1250
    assert.equal(pf.employerEPF, 550) // 1800 - 1250
    assert.equal(pf.employerEDLI, 75) // 0.5% capped at 75
    assert.equal(pf.adminCharges, 75) // 0.5% of 15,000
  })

  test('calculates ESI for eligible gross salary <= ₹21,000', async ({ assert }) => {
    const eligibleESI = TaxCalculationService.calculateESI(20000, false)
    assert.equal(eligibleESI.employeeESI, 150) // ceil(20000 * 0.0075)
    assert.equal(eligibleESI.employerESI, 650) // ceil(20000 * 0.0325)

    const ineligibleESI = TaxCalculationService.calculateESI(25000, false)
    assert.equal(ineligibleESI.employeeESI, 0)
    assert.equal(ineligibleESI.employerESI, 0)
  })

  test('evaluates state professional tax slabs correctly', async ({ assert }) => {
    const ptMhLow = TaxCalculationService.calculateProfessionalTax(7000, 'Maharashtra', 'male')
    assert.equal(ptMhLow, 0)

    const ptMhHigh = TaxCalculationService.calculateProfessionalTax(15000, 'Maharashtra', 'male', 0)
    assert.equal(ptMhHigh, 200)

    const ptKaHigh = TaxCalculationService.calculateProfessionalTax(30000, 'Karnataka')
    assert.equal(ptKaHigh, 200)
  })

  test('calculates TDS under New Tax Regime (Sec 115BAC)', async ({ assert }) => {
    // ₹50,000 monthly gross -> ₹6,00,000 annual gross -> Taxable ₹5,25,000 (<= 7L rebate -> 0 tax)
    const lowTax = TaxCalculationService.calculateNewRegimeTDS(50000)
    assert.equal(lowTax.annualTax, 0)
    assert.equal(lowTax.monthlyTDS, 0)

    // ₹1,00,000 monthly gross -> ₹12,00,000 annual gross -> Taxable ₹11,25,000
    const highTax = TaxCalculationService.calculateNewRegimeTDS(100000)
    assert.isAbove(highTax.annualTax, 0)
    assert.isAbove(highTax.monthlyTDS, 0)
  })
})
