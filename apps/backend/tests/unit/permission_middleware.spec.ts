import { test } from '@japa/runner'
import PermissionMiddleware from '#middleware/permission_middleware'
import { setupTestTenants } from '#tests/helpers/tenant_harness'

test.group('Permission Middleware Spec', () => {
  test('allows Admin and blocks unprivileged Employee on restricted permission', async ({ assert }) => {
    const harness = await setupTestTenants()
    const middleware = new PermissionMiddleware()

    // 1. Test Admin user (has full access)
    let adminPassed = false
    const adminCtx: any = {
      auth: { user: harness.tenantA.admin },
      response: {
        forbidden(payload: any) {
          return payload
        },
      },
    }

    await middleware.handle(adminCtx, async () => {
      adminPassed = true
    }, { permission: 'rbac_manage' })

    assert.isTrue(adminPassed)

    // 2. Test Employee user (lacks rbac_manage permission)
    let employeePassed = false
    let forbiddenCalled = false

    const empCtx: any = {
      auth: { user: harness.tenantA.employee },
      response: {
        forbidden(payload: any) {
          forbiddenCalled = true
          return payload
        },
      },
    }

    await middleware.handle(empCtx, async () => {
      employeePassed = true
    }, { permission: 'rbac_manage' })

    assert.isFalse(employeePassed)
    assert.isTrue(forbiddenCalled)
  })
})
