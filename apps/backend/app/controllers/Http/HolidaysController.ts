import { HttpContext } from '@adonisjs/core/http'
import Holiday from '#models/holiday'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

export default class HolidaysController {
  private static holidayValidator = vine.compile(
    vine.object({
      name: vine.string().trim().minLength(2).maxLength(100),
      holidayDate: vine.string().trim(),
      type: vine.enum(['national', 'company', 'optional'] as const),
    })
  )

  async index({ auth, response }: HttpContext) {
    const employee = auth.user!
    const holidays = await Holiday.query().where('org_id', employee.orgId).orderBy('holiday_date', 'asc')
    return response.ok({ status: 'success', data: holidays })
  }

  async store({ auth, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(HolidaysController.holidayValidator)
    const holiday = await Holiday.create({
      orgId: employee.orgId,
      name: data.name,
      holidayDate: DateTime.fromISO(data.holidayDate),
      type: data.type,
    })

    return response.created({ status: 'success', data: holiday })
  }

  async update({ auth, params, request, response }: HttpContext) {
    const employee = auth.user!
    const data = await request.validateUsing(HolidaysController.holidayValidator)
    const holiday = await Holiday.query()
      .where('org_id', employee.orgId)
      .where('id', params.id)
      .firstOrFail()

    holiday.merge({
      name: data.name,
      holidayDate: DateTime.fromISO(data.holidayDate),
      type: data.type,
    })
    await holiday.save()

    return response.ok({ status: 'success', data: holiday })
  }

  async destroy({ auth, params, response }: HttpContext) {
    const employee = auth.user!
    const holiday = await Holiday.query()
      .where('org_id', employee.orgId)
      .where('id', params.id)
      .firstOrFail()

    await holiday.delete()
    return response.ok({ status: 'success', message: 'Holiday deleted' })
  }
}
