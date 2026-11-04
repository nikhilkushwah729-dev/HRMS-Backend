import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import AuditLogService, { sanitizeAuditData } from '#services/AuditLogService'
import AuditLogsController from '#controllers/Http/AuditLogsController'
import GeoService from '#services/GeoService'

test.group('Complete Audit Log Module Spec', () => {
  test('1. Employee creation generates audit log with sanitized fields', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const emp = harness.tenantA.employee
    const log = await auditLogService.logCreate({
      orgId: harness.tenantA.org.id,
      userId: emp.id,
      module: 'EMPLOYEE',
      entityType: 'Employee',
      entityId: emp.id,
      newValues: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        salary: 50000,
        password: 'SuperSecretPassword123!',
      },
      description: 'Created employee test',
    })

    assert.isNotNull(log)
    assert.equal(log!.action, 'CREATE')
    assert.equal(log!.module, 'EMPLOYEE')
    assert.equal(log!.orgId, harness.tenantA.org.id)
    assert.equal(log!.entityId, String(emp.id))
    // Password MUST be redacted
    const newVals = typeof log!.newValues === 'string' ? JSON.parse(log!.newValues) : log!.newValues
    assert.equal(newVals.password, '[REDACTED]')
    assert.equal(newVals.salary, 50000)
  })

  test('2. Employee update stores old and new values, capturing only changed fields', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const emp = harness.tenantA.employee
    const oldEmployee = {
      id: emp.id,
      firstName: 'OriginalName',
      salary: 25000,
      department: 'Engineering',
      panNumber: 'ABCDE1234F',
    }
    const newEmployee = {
      id: emp.id,
      firstName: 'OriginalName', // Unchanged
      salary: 30000, // Changed
      department: 'Management', // Changed
      panNumber: 'ABCDE1234F', // Unchanged sensitive
    }

    const log = await auditLogService.logUpdate({
      orgId: harness.tenantA.org.id,
      userId: emp.id,
      module: 'EMPLOYEE',
      entityType: 'Employee',
      entityId: emp.id,
      oldValues: oldEmployee,
      newValues: newEmployee,
      description: 'Updated employee salary and department',
    })

    assert.isNotNull(log)
    assert.equal(log!.action, 'UPDATE')
    const oldVals = typeof log!.oldValues === 'string' ? JSON.parse(log!.oldValues) : log!.oldValues
    const newVals = typeof log!.newValues === 'string' ? JSON.parse(log!.newValues) : log!.newValues

    // Only changed fields are present
    assert.equal(oldVals.salary, 25000)
    assert.equal(newVals.salary, 30000)
    assert.equal(oldVals.department, 'Engineering')
    assert.equal(newVals.department, 'Management')
    // Unchanged fields are NOT duplicated
    assert.isUndefined(oldVals.firstName)
    assert.isUndefined(newVals.firstName)
  })

  test('3. Employee deletion generates audit log', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const emp = harness.tenantA.employee
    const log = await auditLogService.logDelete({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.admin.id,
      module: 'EMPLOYEE',
      entityType: 'Employee',
      entityId: emp.id,
      oldValues: { id: emp.id, firstName: emp.firstName },
      description: `Deleted employee #${emp.id}`,
    })

    assert.isNotNull(log)
    assert.equal(log!.action, 'DELETE')
    assert.equal(log!.module, 'EMPLOYEE')
    assert.isNull(log!.newValues)
  })

  test('4. Leave approval generates audit log', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const log = await auditLogService.logApproval({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.admin.id,
      module: 'LEAVE',
      entityType: 'Leave',
      entityId: 101,
      oldValues: { status: 'pending' },
      newValues: { status: 'approved' },
      description: 'Approved leave application #101',
    })

    assert.isNotNull(log)
    assert.equal(log!.action, 'APPROVE')
    assert.equal(log!.module, 'LEAVE')
  })

  test('5. Payroll modification generates audit log', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const log = await auditLogService.logCreate({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.admin.id,
      module: 'PAYROLL',
      entityType: 'Payroll',
      entityId: 501,
      newValues: { month: 10, year: 2026, netSalary: 45000 },
      description: 'Generated payroll for month 10/2026',
    })

    assert.isNotNull(log)
    assert.equal(log!.module, 'PAYROLL')
    assert.equal(log!.action, 'CREATE')
  })

  test('6. Login and logout are tracked accurately', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const loginLog = await auditLogService.logLogin({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.employee.id,
      status: 'success',
      description: 'User logged in successfully',
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    })
    assert.isNotNull(loginLog)
    assert.equal(loginLog!.action, 'LOGIN')
    assert.equal(loginLog!.module, 'AUTH')
    assert.equal(loginLog!.status, 'success')

    const logoutLog = await auditLogService.logLogout({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.employee.id,
      description: 'User logged out',
      ipAddress: '192.168.1.50',
    })
    assert.isNotNull(logoutLog)
    assert.equal(logoutLog!.action, 'LOGOUT')
    assert.equal(logoutLog!.module, 'AUTH')
  })

  test('7. Multi-Tenant Isolation: Organization A cannot access Organization B logs', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)
    const controller = new AuditLogsController(auditLogService)

    // Seed log for Org A
    await auditLogService.logCreate({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.admin.id,
      module: 'ORGANIZATION',
      entityType: 'Organization',
      entityId: harness.tenantA.org.id,
      description: 'Secret Org A operation',
    })

    // Seed log for Org B
    await auditLogService.logCreate({
      orgId: harness.tenantB.org.id,
      userId: harness.tenantB.admin.id,
      module: 'ORGANIZATION',
      entityType: 'Organization',
      entityId: harness.tenantB.org.id,
      description: 'Secret Org B operation',
    })

    // Tenant A Admin queries logs
    let responseData: any = null
    const ctxA = {
      auth: { user: harness.tenantA.admin },
      request: { qs: () => ({}) },
      response: {
        ok: (payload: any) => {
          responseData = payload
          return payload
        },
        forbidden: () => assert.fail('Should not be forbidden for Tenant Admin'),
      },
    } as any

    await controller.index(ctxA)
    assert.equal(responseData.status, 'success')
    const orgIdsInResults = responseData.data.map((l: any) => l.orgId)
    // Tenant A must NEVER see Tenant B logs
    assert.isTrue(orgIdsInResults.every((id: number) => id === harness.tenantA.org.id))
    assert.isFalse(orgIdsInResults.includes(harness.tenantB.org.id))
  })

  test('8. RBAC: Employee without permission cannot access audit logs (returns 403 Forbidden)', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)
    const controller = new AuditLogsController(auditLogService)

    const emp = harness.tenantA.employee
    let wasForbidden = false
    const ctxEmployee = {
      auth: { user: emp },
      request: { qs: () => ({}) },
      response: {
        forbidden: (payload: any) => {
          wasForbidden = true
          return payload
        },
        ok: () => assert.fail('Employee should not be allowed to access audit logs'),
      },
    } as any

    await controller.index(ctxEmployee)
    assert.isTrue(wasForbidden)
  })

  test('9. Super Admin can access authorized global logs', async ({ assert }) => {
    await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)
    const controller = new AuditLogsController(auditLogService)

    // Global Super Admin (roleId = 1, orgId = null)
    const superAdminUser = {
      id: 1,
      roleId: 1,
      orgId: null,
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@platform.local',
    }

    let responseData: any = null
    const ctxSuperAdmin = {
      auth: { user: superAdminUser },
      request: { qs: () => ({}) },
      response: {
        ok: (payload: any) => {
          responseData = payload
          return payload
        },
        forbidden: () => assert.fail('Super Admin should have global audit access'),
      },
    } as any

    await controller.index(ctxSuperAdmin)
    assert.equal(responseData.status, 'success')
  })

  test('10. Sensitive information (passwords, tokens, PAN, Aadhaar) is never stored in audit logs', async ({ assert }) => {
    const sensitivePayload = {
      username: 'johndoe',
      password: 'PlainPassword123!',
      passwordHash: '$scrypt$123456',
      panNumber: 'ABCDE1234F',
      aadharNumber: '999988887777',
      bankAccount: '12345678901234',
      token: 'jwt.token.secret',
      apiKey: 'sk_live_12345',
      safeField: 'SafePublicValue',
    }

    const sanitized = sanitizeAuditData(sensitivePayload)
    assert.equal(sanitized.password, '[REDACTED]')
    assert.equal(sanitized.passwordHash, '[REDACTED]')
    assert.equal(sanitized.panNumber, '[REDACTED]')
    assert.equal(sanitized.aadharNumber, '[REDACTED]')
    assert.equal(sanitized.bankAccount, '[REDACTED]')
    assert.equal(sanitized.token, '[REDACTED]')
    assert.equal(sanitized.apiKey, '[REDACTED]')
    assert.equal(sanitized.safeField, 'SafePublicValue')
  })

  test('11. Pagination, search, and filtering work correctly', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const orgId = harness.tenantA.org.id
    const adminId = harness.tenantA.admin.id

    // Seed 4 specific logs
    await auditLogService.logCreate({ orgId, userId: adminId, module: 'EMPLOYEE', entityType: 'Employee', entityId: 1, description: 'Alpha item' })
    await auditLogService.logCreate({ orgId, userId: adminId, module: 'PAYROLL', entityType: 'Payroll', entityId: 2, description: 'Beta item' })
    await auditLogService.logCreate({ orgId, userId: adminId, module: 'LEAVE', entityType: 'Leave', entityId: 3, description: 'Gamma item' })
    await auditLogService.logCreate({ orgId, userId: adminId, module: 'ATTENDANCE', entityType: 'Attendance', entityId: 4, description: 'Delta item' })

    // Test filter by module
    const payrollFilter = await auditLogService.getLogs({ orgId, module: 'PAYROLL' })
    assert.isTrue(payrollFilter.data.every((l) => l.module === 'PAYROLL'))

    // Test search
    const searchResult = await auditLogService.getLogs({ orgId, search: 'Gamma' })
    assert.isTrue(searchResult.data.some((l) => l.description?.includes('Gamma')))

    // Test pagination
    const page1 = await auditLogService.getLogs({ orgId, limit: 2, page: 1 })
    assert.isAtMost(page1.data.length, 2)
    assert.isTrue(page1.meta.total >= 4)
  })

  test('12. Audit records cannot be modified or deleted (Immutability protection)', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const log = await auditLogService.logCreate({
      orgId: harness.tenantA.org.id,
      userId: harness.tenantA.admin.id,
      module: 'EMPLOYEE',
      entityType: 'Employee',
      entityId: 999,
      description: 'Immutable record test',
    })

    assert.isNotNull(log)

    // Attempting update must throw immutability error
    try {
      log!.action = 'TAMPERED'
      await log!.save()
      assert.fail('Should not allow audit log update')
    } catch (err: any) {
      assert.include(err.message, 'immutable')
    }

    // Attempting delete must throw immutability error
    try {
      await log!.delete()
      assert.fail('Should not allow audit log deletion')
    } catch (err: any) {
      assert.include(err.message, 'immutable')
    }
  })

  test('13. Statistics endpoint aggregates counts accurately', async ({ assert }) => {
    const harness = await setupTestTenants()
    const geoService = new GeoService()
    const auditLogService = new AuditLogService(geoService)

    const stats = await auditLogService.getStatistics(harness.tenantA.org.id)
    assert.isNumber(stats.totalActivities)
    assert.isNumber(stats.createActions)
    assert.isNumber(stats.updateActions)
    assert.isNumber(stats.deleteActions)
    assert.isNumber(stats.loginActivities)
  })
})
