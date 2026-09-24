import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

interface RateLimitBucket {
  count: number
  resetAt: number
}

// In-Memory Rate Limiter Store (No DB table needed)
class MemoryRateLimiter {
  private store = new Map<string, RateLimitBucket>()

  constructor() {
    // Garbage collect expired buckets every 5 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, bucket] of this.store.entries()) {
        if (bucket.resetAt <= now) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000).unref()
  }

  check(key: string, limit: number, windowMs: number): { allowed: boolean; count: number; resetAt: number; remaining: number } {
    const now = Date.now()
    let bucket = this.store.get(key)

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs }
      this.store.set(key, bucket)
    }

    bucket.count += 1
    const remaining = Math.max(0, limit - bucket.count)
    const allowed = bucket.count <= limit

    return { allowed, count: bucket.count, resetAt: bucket.resetAt, remaining }
  }

  reset(key: string) {
    this.store.delete(key)
  }
}

export const rateLimiterStore = new MemoryRateLimiter()

function getClientIp(request: any): string {
  const forwardedFor = request.header('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip: string) => ip.trim())
    if (ips.length > 0 && ips[0]) return ips[0]
  }
  const realIp = request.header('x-real-ip')
  if (realIp) return realIp.trim()
  return request.ip() || '127.0.0.1'
}

export default class RateLimiterMiddleware {
  async handle({ request, response, auth }: HttpContext, next: NextFn) {
    const ip = getClientIp(request)
    const url = request.url().toLowerCase()

    let key: string
    let limit: number
    let windowMs: number

    const isLoginEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/verify-otp') ||
      url.includes('/auth/verify-email-otp') ||
      url.includes('/auth/login-with-verified-email')

    if (isLoginEndpoint) {
      const email = String(request.input('email') || '').trim().toLowerCase()
      key = `limiter:login:${ip}:${email || 'anon'}`
      limit = 10 // 10 attempts
      windowMs = 15 * 60 * 1000 // per 15 mins
    } else {
      let userId: string | null = null
      try {
        const user = auth.user
        if (user) {
          userId = String(user.id)
        }
      } catch (e) {}

      if (userId) {
        // Authenticated APIs keyed on user ID
        key = `limiter:api:user:${userId}`
        limit = 120 // 120 requests
        windowMs = 60 * 1000 // per minute
      } else {
        // Unauthenticated APIs keyed on IP
        key = `limiter:api:ip:${ip}`
        limit = 60 // 60 requests
        windowMs = 60 * 1000 // per minute
      }
    }

    const res = rateLimiterStore.check(key, limit, windowMs)

    response.header('X-RateLimit-Limit', limit.toString())
    response.header('X-RateLimit-Remaining', res.remaining.toString())
    response.header('X-RateLimit-Reset', Math.ceil(res.resetAt / 1000).toString())

    if (!res.allowed) {
      const retryAfterSeconds = Math.ceil((res.resetAt - Date.now()) / 1000)
      response.header('Retry-After', retryAfterSeconds.toString())

      return response.tooManyRequests({
        status: 'error',
        message: 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds,
      })
    }

    await next()
  }
}
