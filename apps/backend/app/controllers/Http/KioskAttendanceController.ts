import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { faceAttendanceValidator, offlineSyncValidator, pinAttendanceValidator, qrAttendanceValidator } from '#validators/kiosk'
import KioskAttendanceService from '#services/KioskAttendanceService'

@inject()
export default class KioskAttendanceController {
  constructor(protected kioskAttendanceService: KioskAttendanceService) {}

  async markFace(ctx: HttpContext) {
    const kiosk = (ctx as any).kiosk
    const payload = await ctx.request.validateUsing(faceAttendanceValidator)
    const result = await this.kioskAttendanceService.submitFaceAttendance(kiosk, payload, ctx)

    return ctx.response.ok({ status: 'success', data: result })
  }

  async markPin(ctx: HttpContext) {
    const kiosk = (ctx as any).kiosk
    const payload = await ctx.request.validateUsing(pinAttendanceValidator)
    const result = await this.kioskAttendanceService.submitPinAttendance(kiosk, payload, ctx)

    return ctx.response.ok({ status: 'success', data: result })
  }

  async markQr(ctx: HttpContext) {
    const kiosk = (ctx as any).kiosk
    const payload = await ctx.request.validateUsing(qrAttendanceValidator)
    const result = await this.kioskAttendanceService.submitQrAttendance(kiosk, payload, ctx)

    return ctx.response.ok({ status: 'success', data: result })
  }

  async logs({ auth, request, response }: HttpContext) {
    const logs = await this.kioskAttendanceService.getAttendanceLogs(auth.user!.orgId, request.qs())
    return response.ok({ status: 'success', data: logs.all(), meta: logs.getMeta() })
  }

  async offlineSync(ctx: HttpContext) {
    const kiosk = (ctx as any).kiosk
    const payload = await ctx.request.validateUsing(offlineSyncValidator)
    const results = await this.kioskAttendanceService.syncOffline(kiosk, payload.records, ctx)

    return ctx.response.ok({ status: 'success', data: results })
  }
}
