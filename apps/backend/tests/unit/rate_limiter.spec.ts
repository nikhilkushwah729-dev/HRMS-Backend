import { test } from '@japa/runner'
import RateLimiterMiddleware, { rateLimiterStore } from '#middleware/rate_limiter_middleware'

test.group('Rate Limiter Middleware Spec', () => {
  test('rate limits login request after threshold on IP+email key', async ({ assert }) => {
    const middleware = new RateLimiterMiddleware()
    const ip = '10.0.0.99'
    const email = 'test.limiter@example.com'

    // Clean store before test
    rateLimiterStore.reset(`limiter:login:${ip}:${email}`)

    const headers: Record<string, string> = {}
    let lastStatus = 200

    for (let i = 0; i < 11; i++) {
      const ctx: any = {
        request: {
          url: () => '/api/auth/login',
          header: (name: string) => (name === 'x-forwarded-for' ? ip : null),
          ip: () => ip,
          input: (field: string) => (field === 'email' ? email : null),
        },
        response: {
          header(name: string, value: string) {
            headers[name] = value
          },
          tooManyRequests(payload: any) {
            lastStatus = 429
            return payload
          },
        },
        auth: { user: null },
      }

      await middleware.handle(ctx, async () => {})
    }

    assert.equal(lastStatus, 429)
    assert.isDefined(headers['Retry-After'])
    assert.equal(headers['X-RateLimit-Limit'], '10')
    assert.equal(headers['X-RateLimit-Remaining'], '0')
  })
})
