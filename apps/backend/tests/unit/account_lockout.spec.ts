import { test } from '@japa/runner'
import { setupTestTenants } from '#tests/helpers/tenant_harness'
import AuthService from '#services/AuthService'
import app from '@adonisjs/core/services/app'
import Employee from '#models/employee'
import { DateTime } from 'luxon'

test.group('Account Lockout Spec', () => {
  test('locks account after 5 failed attempts and allows admin unlock', async ({ assert }) => {
    const harness = await setupTestTenants()
    const authService = await app.container.make(AuthService)

    const emp = harness.tenantA.employee
    const ip = '192.168.1.100'

    // Simulate 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      try {
        await authService.login(emp.email!, 'WrongPassword123!', ip, 'TestAgent')
      } catch (err) {
        // Expected invalid credentials error
      }
    }

    // Refresh employee instance
    const updatedEmp = await Employee.findOrFail(emp.id)
    assert.isTrue(Boolean(updatedEmp.isLocked))
    assert.isNotNull(updatedEmp.lockedUntil)
    assert.isTrue(updatedEmp.lockedUntil! > DateTime.now())

    // Attempt login while locked -> should throw 403 generic error
    try {
      await authService.login(emp.email!, 'Password123!', ip, 'TestAgent')
      assert.fail('Should have thrown 403 generic lockout error')
    } catch (err: any) {
      assert.equal(err.status, 403)
      assert.include(err.message, 'Account is temporarily locked')
    }

    // Unlock via admin action
    updatedEmp.isLocked = false
    updatedEmp.lockedUntil = null
    await updatedEmp.save()

    const unlockedEmp = await Employee.findOrFail(emp.id)
    assert.isFalse(Boolean(unlockedEmp.isLocked))
    assert.isNull(unlockedEmp.lockedUntil)
  })
})
