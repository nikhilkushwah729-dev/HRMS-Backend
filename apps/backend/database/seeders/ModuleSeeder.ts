import { BaseSeeder } from '@adonisjs/lucid/seeders'
import AddonPrice from '#models/AddonPrice'

export default class extends BaseSeeder {
    async run() {
        await AddonPrice.updateOrCreateMany('slug', [
            {
                name: 'Attendance & Tracking',
                slug: 'attendance',
                price: 0,
                isActive: true
            },
            {
                name: 'Payroll Management',
                slug: 'payroll',
                price: 0,
                isActive: true
            },
            {
                name: 'Project & Task Management',
                slug: 'projects',
                price: 0,
                isActive: true
            },
            {
                name: 'Expense Tracking',
                slug: 'expenses',
                price: 0,
                isActive: true
            },
            {
                name: 'Timesheet Management',
                slug: 'timesheets',
                price: 0,
                isActive: true
            },
            {
                name: 'Announcements',
                slug: 'announcements',
                price: 0,
                isActive: true
            }
        ])
    }
}
