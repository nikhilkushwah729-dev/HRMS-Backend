import { test } from '@japa/runner'
import AuthorizationService from '#services/AuthorizationService'
import Employee from '#models/employee'
import Role from '#models/role'
import Permission from '#models/permission'

test.group('PII Backend Sanitization Spec', () => {
  const authService = new AuthorizationService()

  test('1. Manager -> Reportee: PII fields are masked', async ({ assert }) => {
    const managerActor = new Employee()
    managerActor.id = 3
    managerActor.roleId = 4 // Manager Role

    const reporteeRecord = {
      id: 2,
      firstName: 'Priya',
      lastName: 'Verma',
      salary: '65000.00',
      panNumber: 'PRYA1234F',
      bankAccount: '987654322222',
      ifscCode: 'HDFC0005678',
    }

    const sanitized = authService.sanitizeEmployeeData(reporteeRecord, managerActor)

    assert.equal(sanitized.salary, '₹•••••')
    assert.equal(sanitized.panNumber, 'PR••••••4F')
    assert.equal(sanitized.bankAccount, '••••••••2222')
    assert.equal(sanitized.ifscCode, 'HDFC••••678')
  })

  test('2. Manager -> Non-reportee: canAccessEmployee blocks access completely', async ({ assert }) => {
    const managerActor = new Employee()
    managerActor.id = 3
    managerActor.orgId = 1001
    managerActor.roleId = 4 // Manager Role (scope = team)

    const nonReporteeSubject = new Employee()
    nonReporteeSubject.id = 99
    nonReporteeSubject.orgId = 1001
    nonReporteeSubject.managerId = 88 // Not managed by Manager 3

    const canAccess = await authService.canAccessEmployee(managerActor, nonReporteeSubject)
    assert.isFalse(canAccess)
  })

  test('3. HR/Admin -> Employee: returns full unmasked PII values', async ({ assert }) => {
    const adminActor = new Employee()
    adminActor.id = 1
    adminActor.roleId = 2 // Organization Admin

    const employeeRecord = {
      id: 2,
      firstName: 'Priya',
      lastName: 'Verma',
      salary: '65000.00',
      panNumber: 'PRYA1234F',
      bankAccount: '987654322222',
      ifscCode: 'HDFC0005678',
    }

    const sanitized = authService.sanitizeEmployeeData(employeeRecord, adminActor)

    assert.equal(sanitized.salary, '65000.00')
    assert.equal(sanitized.panNumber, 'PRYA1234F')
    assert.equal(sanitized.bankAccount, '987654322222')
    assert.equal(sanitized.ifscCode, 'HDFC0005678')
  })

  test('4. payroll_read permission -> Employee: returns full unmasked PII values', async ({ assert }) => {
    const payrollActor = new Employee()
    payrollActor.id = 10
    payrollActor.roleId = 99
    payrollActor.role = new Role()
    payrollActor.role.permissions = [
      { permissionKey: 'payroll_read' } as Permission
    ]

    const employeeRecord = {
      id: 2,
      salary: '65000.00',
      panNumber: 'PRYA1234F',
      bankAccount: '987654322222',
      ifscCode: 'HDFC0005678',
    }

    const sanitized = authService.sanitizeEmployeeData(employeeRecord, payrollActor)

    assert.equal(sanitized.salary, '65000.00')
    assert.equal(sanitized.panNumber, 'PRYA1234F')
    assert.equal(sanitized.bankAccount, '987654322222')
    assert.equal(sanitized.ifscCode, 'HDFC0005678')
  })

  test('5. payroll_process permission -> Employee: returns full unmasked PII values', async ({ assert }) => {
    const processActor = new Employee()
    processActor.id = 11
    processActor.roleId = 98
    processActor.role = new Role()
    processActor.role.permissions = [
      { permissionKey: 'payroll_process' } as Permission
    ]

    const employeeRecord = {
      id: 2,
      salary: '65000.00',
      panNumber: 'PRYA1234F',
      bankAccount: '987654322222',
      ifscCode: 'HDFC0005678',
    }

    const sanitized = authService.sanitizeEmployeeData(employeeRecord, processActor)

    assert.equal(sanitized.salary, '65000.00')
    assert.equal(sanitized.panNumber, 'PRYA1234F')
    assert.equal(sanitized.bankAccount, '987654322222')
    assert.equal(sanitized.ifscCode, 'HDFC0005678')
  })

  test('6. Employee -> Self: permitted according to existing authorization model', async ({ assert }) => {
    const selfActor = new Employee()
    selfActor.id = 2
    selfActor.orgId = 1001
    selfActor.roleId = 5 // Employee Role

    const selfSubject = new Employee()
    selfSubject.id = 2
    selfSubject.orgId = 1001

    const canAccess = await authService.canAccessEmployee(selfActor, selfSubject)
    assert.isTrue(canAccess)

    const selfRecord = {
      id: 2,
      firstName: 'Priya',
      lastName: 'Verma',
      salary: '65000.00',
      panNumber: 'PRYA1234F',
      bankAccount: '987654322222',
      ifscCode: 'HDFC0005678',
    }

    const sanitized = authService.sanitizeEmployeeData(selfRecord, selfActor)

    assert.equal(sanitized.salary, '65000.00')
    assert.equal(sanitized.panNumber, 'PRYA1234F')
    assert.equal(sanitized.bankAccount, '987654322222')
    assert.equal(sanitized.ifscCode, 'HDFC0005678')
  })

  test('7. Raw PII does NOT appear anywhere in Manager response payload string', async ({ assert }) => {
    const managerActor = new Employee()
    managerActor.id = 3
    managerActor.roleId = 4

    const rawValues = {
      id: 2,
      salary: '65000.00',
      panNumber: 'PRYA1234F',
      bankAccount: '987654322222',
      ifscCode: 'HDFC0005678',
    }

    const sanitized = authService.sanitizeEmployeeData(rawValues, managerActor)
    const jsonString = JSON.stringify(sanitized)

    assert.notInclude(jsonString, '65000.00')
    assert.notInclude(jsonString, 'PRYA1234F')
    assert.notInclude(jsonString, '987654322222')
    assert.notInclude(jsonString, 'HDFC0005678')
  })
})
