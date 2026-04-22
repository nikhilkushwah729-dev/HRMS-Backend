import { BaseSeeder } from '@adonisjs/lucid/seeders'
import AddonPrice from '#models/AddonPrice'

export default class extends BaseSeeder {
    async run() {
        await AddonPrice.updateOrCreateMany('slug', [
            {
                name: 'Attendance & Tracking',
                slug: 'attendance',
                price: 400,
                isActive: true
            },
            {
                name: 'Payroll Management',
                slug: 'payroll',
                price: 500,
                isActive: true
            },
            {
                name: 'Project & Task Management',
                slug: 'projects',
                price: 300,
                isActive: true
            },
            {
                name: 'Expense Tracking',
                slug: 'expenses',
                price: 300,
                isActive: true
            },
            {
                name: 'Timesheet Management',
                slug: 'timesheets',
                price: 200,
                isActive: true
            },
            {
                name: 'Announcements',
                slug: 'announcements',
                price: 100,
                isActive: true
            },
            {
                name: 'Visit Management',
                slug: 'visitorManagement',
                price: 300,
                isActive: true
            }
        ])
    }
}
