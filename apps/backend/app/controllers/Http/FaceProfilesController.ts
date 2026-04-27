import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import EmployeeFaceProfile from '#models/employee_face_profile'
import Employee from '#models/employee'
import KioskAttendanceService from '#services/KioskAttendanceService'
import { faceProfileValidator } from '#validators/kiosk'

@inject()
export default class FaceProfilesController {
  constructor(protected kioskAttendanceService: KioskAttendanceService) {}

  async create(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(faceProfileValidator)
    const employee = await Employee.query()
      .where('org_id', ctx.auth.user!.orgId)
      .where('id', Number(ctx.params.id))
      .firstOrFail()

    const profile = await this.kioskAttendanceService.upsertFaceProfile(
      {
        orgId: employee.orgId,
        employeeId: employee.id,
        embedding: payload.embedding,
        referenceImageUrl: payload.referenceImageUrl,
        createdBy: ctx.auth.user!.id,
      },
      ctx,
    )

    return ctx.response.created({ status: 'success', message: 'Face profile submitted for approval', data: profile })
  }

  async pending({ auth, response }: HttpContext) {
    const profiles = await EmployeeFaceProfile.query()
      .where('org_id', auth.user!.orgId)
      .where('status', 'pending')
      .preload('employee')
      .orderBy('created_at', 'desc')

    return response.ok({ status: 'success', data: profiles })
  }

  async approve(ctx: HttpContext) {
    const profile = await EmployeeFaceProfile.query()
      .where('org_id', ctx.auth.user!.orgId)
      .where('id', Number(ctx.params.id))
      .firstOrFail()

    const updated = await this.kioskAttendanceService.approveFaceProfile(profile, ctx.auth.user!.id, ctx)
    return ctx.response.ok({ status: 'success', message: 'Face profile approved', data: updated })
  }

  async reject(ctx: HttpContext) {
    const profile = await EmployeeFaceProfile.query()
      .where('org_id', ctx.auth.user!.orgId)
      .where('id', Number(ctx.params.id))
      .firstOrFail()

    const updated = await this.kioskAttendanceService.rejectFaceProfile(profile, ctx.auth.user!.id, ctx)
    return ctx.response.ok({ status: 'success', message: 'Face profile rejected', data: updated })
  }
}
