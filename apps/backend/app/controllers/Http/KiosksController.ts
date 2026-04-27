import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { registerKioskValidator, validateKioskValidator, kioskApprovalValidator } from '#validators/kiosk'
import Kiosk from '#models/kiosk'
import KioskAttendanceService from '#services/KioskAttendanceService'

@inject()
export default class KiosksController {
  constructor(protected kioskAttendanceService: KioskAttendanceService) {}

  async register({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(registerKioskValidator)
    const kiosk = await this.kioskAttendanceService.registerKiosk({
      ...payload,
      registeredBy: auth.user?.id ?? null,
    })

    const message = kiosk.status === 'active'
      ? 'Kiosk is already active and ready to use.'
      : kiosk.status === 'inactive'
        ? 'Kiosk is registered but currently inactive.'
        : kiosk.status === 'blocked'
          ? 'Kiosk is blocked. Contact an administrator.'
          : 'Kiosk registered. Approval is pending.'

    return response.created({
      status: 'success',
      message,
      data: {
        ...kiosk.toJSON(),
        deviceToken: kiosk.deviceToken,
      },
    })
  }

  async validate({ request, response }: HttpContext) {
    const payload = await request.validateUsing(validateKioskValidator)
    const kiosk = await this.kioskAttendanceService.validateKiosk(payload.deviceId, payload.deviceToken)

    return response.ok({
      status: 'success',
      data: {
        id: kiosk.id,
        name: kiosk.name,
        location: kiosk.location,
        status: kiosk.status,
        orgId: kiosk.orgId,
        orgLocationId: kiosk.orgLocationId,
      },
    })
  }

  async index({ auth, request, response }: HttpContext) {
    const orgId = auth.user!.orgId
    const status = request.input('status')

    const query = Kiosk.query().where('org_id', orgId).orderBy('created_at', 'desc')
    if (status) {
      query.where('status', String(status))
    }

    const kiosks = await query
    return response.ok({ status: 'success', data: kiosks })
  }

  async show({ auth, params, response }: HttpContext) {
    const kiosk = await Kiosk.query()
      .where('org_id', auth.user!.orgId)
      .where('id', Number(params.id))
      .firstOrFail()

    return response.ok({ status: 'success', data: kiosk })
  }

  async approve({ auth, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(kioskApprovalValidator)
    const kiosk = await Kiosk.query()
      .where('org_id', auth.user!.orgId)
      .where('id', Number(params.id))
      .firstOrFail()

    const updated = await this.kioskAttendanceService.approveKiosk(kiosk, auth.user!.id, payload.orgLocationId)
    return response.ok({ status: 'success', message: 'Kiosk approved', data: { ...updated.toJSON(), deviceToken: updated.deviceToken } })
  }

  async block({ auth, params, response }: HttpContext) {
    const kiosk = await Kiosk.query()
      .where('org_id', auth.user!.orgId)
      .where('id', Number(params.id))
      .firstOrFail()

    const updated = await this.kioskAttendanceService.blockKiosk(kiosk, auth.user!.id)
    return response.ok({ status: 'success', message: 'Kiosk blocked', data: updated })
  }

  async toggle({ auth, params, response }: HttpContext) {
    const kiosk = await Kiosk.query()
      .where('org_id', auth.user!.orgId)
      .where('id', Number(params.id))
      .firstOrFail()

    const updated = await this.kioskAttendanceService.toggleKiosk(kiosk, auth.user!.id)
    return response.ok({ status: 'success', message: 'Kiosk status updated', data: updated })
  }

  async resetToken({ auth, params, response }: HttpContext) {
    const kiosk = await Kiosk.query()
      .where('org_id', auth.user!.orgId)
      .where('id', Number(params.id))
      .firstOrFail()

    const updated = await this.kioskAttendanceService.resetKioskToken(kiosk, auth.user!.id)
    return response.ok({ status: 'success', message: 'Kiosk token reset', data: { ...updated.toJSON(), deviceToken: updated.deviceToken } })
  }
}


