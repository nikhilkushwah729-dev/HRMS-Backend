import { test } from '@japa/runner'
import SecurityHeadersMiddleware from '#middleware/security_headers_middleware'

test.group('Security Headers Middleware Spec', () => {
  test('sets X-Content-Type-Options, X-Frame-Options and X-XSS-Protection headers', async ({ assert }) => {
    const middleware = new SecurityHeadersMiddleware()
    const headers: Record<string, string> = {}

    const ctx: any = {
      response: {
        header(name: string, value: string) {
          headers[name] = value
        }
      }
    }

    await middleware.handle(ctx, async () => {})

    assert.equal(headers['X-Content-Type-Options'], 'nosniff')
    assert.equal(headers['X-Frame-Options'], 'DENY')
    assert.equal(headers['X-XSS-Protection'], '1; mode=block')
    assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
    assert.isDefined(headers['Permissions-Policy'])
  })
})
