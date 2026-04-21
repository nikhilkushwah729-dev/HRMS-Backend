import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Plan from '#models/plan'

export default class extends BaseSeeder {
  async run() {
    await Plan.updateOrCreate(
      { slug: 'trial' },
      {
        name: 'Free Trial',
        slug: 'trial',
        monthlyPrice: 0,
        yearlyPrice: 0,
        price: 0,
        currency: 'INR',
        userLimit: 20,
        storageLimitMb: 512,
        durationDays: 7,
        isTrialPlan: true,
        isPublic: false,
        isActive: true,
        sortOrder: 0,
        modules: JSON.stringify(['ESS', 'Attendance', 'Leaves']),
        features: JSON.stringify({
          employee_management: true,
          attendance_tracking: true,
          leave_management: true,
          payroll: false,
          visit_management: false,
          expense_management: false,
        }),
      }
    )

    await Plan.updateOrCreate(
      { slug: 'basic' },
      {
        name: 'Basic',
        slug: 'basic',
        monthlyPrice: 599,
        yearlyPrice: 5990,
        price: 599,
        currency: 'INR',
        userLimit: 20,
        storageLimitMb: 512,
        durationDays: 30,
        isTrialPlan: false,
        isPublic: true,
        isActive: true,
        sortOrder: 1,
        modules: JSON.stringify(['ESS', 'Attendance', 'Leaves']),
        features: JSON.stringify({
          employee_management: true,
          attendance_tracking: true,
          leave_management: true,
          payroll: false,
          visit_management: false,
          expense_management: false,
        }),
      }
    )

    await Plan.updateOrCreate(
      { slug: 'pro' },
      {
        name: 'Pro',
        slug: 'pro',
        monthlyPrice: 1499,
        yearlyPrice: 14990,
        price: 1499,
        currency: 'INR',
        userLimit: 100,
        storageLimitMb: 5120,
        durationDays: 30,
        isTrialPlan: false,
        isPublic: true,
        isActive: true,
        sortOrder: 2,
        modules: JSON.stringify(['ESS', 'Attendance', 'Leaves', 'Payroll', 'Visits', 'Expenses']),
        features: JSON.stringify({
          employee_management: true,
          attendance_tracking: true,
          leave_management: true,
          payroll: true,
          visit_management: true,
          expense_management: true,
        }),
      }
    )

    await Plan.updateOrCreate(
      { slug: 'enterprise' },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        monthlyPrice: 4999,
        yearlyPrice: 49990,
        price: 4999,
        currency: 'INR',
        userLimit: 1000,
        storageLimitMb: 102400,
        durationDays: 30,
        isTrialPlan: false,
        isPublic: true,
        isActive: true,
        sortOrder: 3,
        modules: JSON.stringify(['ESS', 'Attendance', 'Leaves', 'Payroll', 'Visits', 'Expenses', 'Assets', 'Performance']),
        features: JSON.stringify({
          employee_management: true,
          attendance_tracking: true,
          leave_management: true,
          payroll: true,
          visit_management: true,
          expense_management: true,
          asset_tracking: true,
          performance_reviews: true,
        }),
      }
    )
  }
}
