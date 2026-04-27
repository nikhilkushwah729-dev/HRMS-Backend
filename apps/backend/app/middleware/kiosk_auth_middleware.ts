import { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Kiosk from '#models/kiosk'

export default class KioskAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const deviceId = ctx.request.header('x-device-id') || ctx.request.input('deviceId') || ctx.request.input('device_id')
    const token = this.extractToken(ctx)

    if (!deviceId || !token) {
      return ctx.response.unauthorized({
        status: 'error',
        message: 'Kiosk credentials are required',
      })
    }

    const kiosk = await Kiosk.query()
      .where('device_id', deviceId)
      .where('device_token', token)
      .first()

    if (!kiosk) {
      return ctx.response.unauthorized({
        status: 'error',
        message: 'Device not authorized',
      })
    }

    if (kiosk.status !== 'active') {
      return ctx.response.forbidden({
        status: 'error',
        message: 'Kiosk is not active',
      })
    }

    kiosk.lastSeenAt = DateTime.now()
    await kiosk.save()

    ;(ctx as any).kiosk = kiosk
    await next()
  }

  private extractToken(ctx: HttpContext): string | null {
    const bearer = ctx.request.header('authorization')
    if (bearer?.startsWith('Bearer ')) {
      return bearer.slice(7).trim()
    }

    return ctx.request.header('x-kiosk-token') || ctx.request.input('deviceToken') || ctx.request.input('device_token') || null
  }
}
