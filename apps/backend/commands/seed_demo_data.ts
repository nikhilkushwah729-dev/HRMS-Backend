import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Employee from '#models/employee'
import Organization from '#models/organization'
import Role from '#models/role'
import LeaveType from '#models/leave_type'
import Leave from '#models/leave'
import Attendance from '#models/attendance'
import Payroll from '#models/payroll'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'

export default class SeedDemoData extends BaseCommand {
  static commandName = 'seed:demo-data'
  static description = 'Seed rich demo dataset for HRMS frontend testing with Attendance, Half-Day Leave, and Payroll'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Seeding demo data into database...')

    const defaultPasswordHash = await hash.make('Password123!')

    // 1. Ensure Roles
    const roles = [
      { id: 1, roleName: 'Super Admin', isSystem: true },
      { id: 2, roleName: 'Organization Admin', isSystem: true },
      { id: 3, roleName: 'HR Manager', isSystem: true },
      { id: 4, roleName: 'Manager', isSystem: true },
      { id: 5, roleName: 'Employee', isSystem: true },
    ]
    for (const r of roles) {
      await Role.updateOrCreate({ id: r.id }, r)
    }

    // 2. Provision Org
    const org = await Organization.updateOrCreate(
      { id: 1001 },
      {
        companyName: 'Acme Global HRMS',
        slug: 'acme-global',
        email: 'contact@acmeglobal.com',
        isActive: true,
        timezone: 'Asia/Kolkata',
        subscriptionStatus: 'active',
        userLimit: 100,
      }
    )

    // 3. Provision Main Admin / Employee User
    const admin = await Employee.updateOrCreate(
      { email: 'admin.a@tenanta.com' },
      {
        orgId: org.id,
        roleId: 2,
        firstName: 'Alex',
        lastName: 'Rivera',
        passwordHash: defaultPasswordHash,
        status: 'active',
        emailVerified: true,
        salary: 75000,
        panNumber: 'ALEX1234F',
        bankAccount: '987654321111',
        ifscCode: 'SBIN0001111',
      }
    )

    const emp3 = await Employee.updateOrCreate(
      { email: 'rohan.m@tenanta.com' },
      {
        orgId: org.id,
        roleId: 4, // Manager Role
        firstName: 'Rohan',
        lastName: 'Mehta',
        passwordHash: defaultPasswordHash,
        status: 'active',
        emailVerified: true,
        salary: 55000,
        panNumber: 'ROHN1234F',
        bankAccount: '987654323333',
        ifscCode: 'SBIN0003333',
      }
    )

    const emp2 = await Employee.updateOrCreate(
      { email: 'priya.v@tenanta.com' },
      {
        orgId: org.id,
        roleId: 5, // Employee Role
        managerId: emp3.id, // Rohan is Priya's Manager
        firstName: 'Priya',
        lastName: 'Verma',
        passwordHash: defaultPasswordHash,
        status: 'active',
        emailVerified: true,
        salary: 65000,
        panNumber: 'PRYA1234F',
        bankAccount: '987654322222',
        ifscCode: 'HDFC0005678',
      }
    )

    // 4. Provision Leave Types
    const casualLeave = await LeaveType.updateOrCreate(
      { id: 1, orgId: org.id },
      {
        typeName: 'Casual Leave',
        daysAllowed: 12,
        carryForward: true,
        maxCarryDays: 5,
        isPaid: true,
        requiresDoc: false,
      }
    )

    const sickLeave = await LeaveType.updateOrCreate(
      { id: 2, orgId: org.id },
      {
        typeName: 'Sick Leave',
        daysAllowed: 10,
        carryForward: false,
        maxCarryDays: 0,
        isPaid: true,
        requiresDoc: true,
      }
    )

    // 5. Provision Leave Requests (Including Half-Day Leave!)
    await Leave.updateOrCreate(
      { id: 1 },
      {
        orgId: org.id,
        employeeId: admin.id,
        leaveTypeId: casualLeave.id,
        startDate: '2026-10-15',
        endDate: '2026-10-15',
        durationType: 'half_day',
        halfDaySession: 'second_half',
        reason: 'Doctor appointment in afternoon session',
        status: 'pending',
      }
    )

    await Leave.updateOrCreate(
      { id: 2 },
      {
        orgId: org.id,
        employeeId: emp2.id,
        leaveTypeId: sickLeave.id,
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        durationType: 'full_day',
        reason: 'Viral fever rest per doctor advice',
        status: 'approved',
      }
    )

    // 6. Provision Attendance Records
    const todayStr = DateTime.now().toISODate() || '2026-09-25'
    await Attendance.updateOrCreate(
      { id: 1 },
      {
        orgId: org.id,
        employeeId: admin.id,
        attendanceDate: todayStr,
        checkIn: `${todayStr} 09:00:00`,
        checkOut: `${todayStr} 17:30:00`,
        status: 'present',
        isLate: false,
        isHalfDay: false,
        totalBreakMin: 30,
        netWorkHours: 8.5,
        source: 'web',
      }
    )

    await Attendance.updateOrCreate(
      { id: 2 },
      {
        orgId: org.id,
        employeeId: emp2.id,
        attendanceDate: todayStr,
        checkIn: `${todayStr} 13:00:00`,
        checkOut: `${todayStr} 17:30:00`,
        status: 'half_day',
        isLate: false,
        isHalfDay: true,
        totalBreakMin: 0,
        netWorkHours: 4.5,
        source: 'web',
      }
    )

    await Attendance.updateOrCreate(
      { id: 3 },
      {
        orgId: org.id,
        employeeId: emp3.id,
        attendanceDate: todayStr,
        checkIn: null,
        checkOut: null,
        status: 'absent',
        isLate: false,
        isHalfDay: false,
        totalBreakMin: 0,
        netWorkHours: 0.0,
        source: 'web',
      }
    )

    // 7. Provision Payroll Records
    await Payroll.updateOrCreate(
      { id: 1 },
      {
        orgId: org.id,
        employeeId: admin.id,
        month: 10,
        year: 2026,
        basicSalary: 45000,
        hra: 18000,
        allowances: 7000,
        bonus: 2000,
        pfDeduction: 1800,
        esiDeduction: 0,
        tdsDeduction: 2500,
        otherDeductions: 500,
        paymentMode: 'bank_transfer',
        status: 'processed',
      }
    )

    await Payroll.updateOrCreate(
      { id: 2 },
      {
        orgId: org.id,
        employeeId: emp2.id,
        month: 10,
        year: 2026,
        basicSalary: 38000,
        hra: 15000,
        allowances: 6000,
        bonus: 1000,
        pfDeduction: 1800,
        esiDeduction: 0,
        tdsDeduction: 1500,
        otherDeductions: 300,
        paymentMode: 'bank_transfer',
        status: 'processed',
      }
    )

    this.logger.info('Successfully seeded demo employees, attendance, half-day leaves, and payroll records!')
  }
}
