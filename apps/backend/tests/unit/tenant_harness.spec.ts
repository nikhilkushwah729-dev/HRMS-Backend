import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'

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
})
