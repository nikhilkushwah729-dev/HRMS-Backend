import { HttpContext } from '@adonisjs/core/http'
import EmployeeEducation from '#models/employee_education'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class EmployeeEducationsController {
    static validator = vine.compile(
        vine.object({
            institution: vine.string().maxLength(255),
            degree: vine.string().maxLength(255),
            fieldOfStudy: vine.string().maxLength(255).optional().nullable(),
            startDate: vine.string().optional().nullable(),
            endDate: vine.string().optional().nullable(),
            grade: vine.string().maxLength(50).optional().nullable(),
            description: vine.string().optional().nullable(),
        })
    )

    async index({ auth, response }: HttpContext) {
        const user = auth.user!
        const education = await EmployeeEducation.query()
            .where('employee_id', user.id)
            .orderBy('start_date', 'desc')

        return response.ok({
            status: 'success',
            data: education
        })
    }

    async store({ auth, request, response }: HttpContext) {
        const user = auth.user!
        const data = await request.validateUsing(EmployeeEducationsController.validator)

        const education = await EmployeeEducation.create({
            ...data,
            employeeId: user.id
        })

        return response.created({
            status: 'success',
            data: education
        })
    }

    async update({ auth, params, request, response }: HttpContext) {
        const user = auth.user!
        const education = await EmployeeEducation.query()
            .where('id', params.id)
            .where('employee_id', user.id)
            .first()

        if (!education) {
            return response.notFound({ status: 'error', message: 'Education not found' })
        }

        const data = await request.validateUsing(EmployeeEducationsController.validator)
        education.merge(data)
        await education.save()

        return response.ok({
            status: 'success',
            data: education
        })
    }

    async destroy({ auth, params, response }: HttpContext) {
        const user = auth.user!
        const education = await EmployeeEducation.query()
            .where('id', params.id)
            .where('employee_id', user.id)
            .first()

        if (!education) {
            return response.notFound({ status: 'error', message: 'Education not found' })
        }

        await education.delete()

        return response.ok({
            status: 'success',
            message: 'Education deleted'
        })
    }
}
