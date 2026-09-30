import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import EmployeeService from '#services/EmployeeService'
import Employee from '#models/employee'

test.group('Tenant Harness Spec', () => {
  test('provisions dual tenants (A and B) with 4 roles each', async ({ assert }) => {
    const harness = await setupTestTenants()

    assert.equal(harness.tenantA.org.companyName, 'Tenant Alpha Inc')
    assert.equal(harness.tenantB.org.companyName, 'Tenant Beta Corp')

    assert.equal(harness.tenantA.admin.orgId, harness.tenantA.org.id)
    assert.equal(harness.tenantA.hr.orgId, harness.tenantA.org.id)
    assert.equal(harness.tenantA.manager.orgId, harness.tenantA.org.id)
    assert.equal(harness.tenantA.employee.orgId, harness.tenantA.org.id)

    assert.equal(harness.tenantB.admin.orgId, harness.tenantB.org.id)
    assert.equal(harness.tenantB.hr.orgId, harness.tenantB.org.id)
    assert.equal(harness.tenantB.manager.orgId, harness.tenantB.org.id)
    assert.equal(harness.tenantB.employee.orgId, harness.tenantB.org.id)

    assert.notEqual(harness.tenantA.org.id, harness.tenantB.org.id)
  })

  test('rejects employee creation with 404 when target orgId is invalid and creates no employee', async ({ assert }) => {
    await setupTestTenants()
    const service = new EmployeeService()
    const invalidOrgId = 999999
    const testEmail = `tenant.isolation.test.${Date.now()}@example.com`

    try {
      await service.create(invalidOrgId, {
        firstName: 'Unauthorized',
        lastName: 'Tenant',
        email: testEmail,
        roleId: 5,
      })
      assert.fail('Should have thrown 404 Organization not found Exception')
    } catch (error: any) {
      assert.equal(error.status, 404)
      assert.include(error.message, 'Organization not found')
    }

    // Verify database: no employee with this email exists in any tenant
    const createdEmployee = await Employee.findBy('email', testEmail)
    assert.isNull(createdEmployee)
  })
})
