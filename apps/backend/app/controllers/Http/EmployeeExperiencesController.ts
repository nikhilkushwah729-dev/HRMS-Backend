import { HttpContext } from '@adonisjs/core/http'
import EmployeeExperience from '#models/employee_experience'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class EmployeeExperiencesController {
    static validator = vine.compile(
        vine.object({
            companyName: vine.string().maxLength(255),
            role: vine.string().maxLength(255),
            location: vine.string().maxLength(255).optional(),
            startDate: vine.string(),
            endDate: vine.string().optional().nullable(),
            isCurrent: vine.boolean().optional(),
            description: vine.string().optional().nullable(),
        })
    )

    async index({ auth, response }: HttpContext) {
        const user = auth.user!
        const experiences = await EmployeeExperience.query()
            .where('employee_id', user.id)
            .orderBy('start_date', 'desc')

        return response.ok({
            status: 'success',
            data: experiences
        })
    }

    async store({ auth, request, response }: HttpContext) {
        const user = auth.user!
        const data = await request.validateUsing(EmployeeExperiencesController.validator)

        const experience = await EmployeeExperience.create({
            ...data,
            employeeId: user.id
        })

        return response.created({
            status: 'success',
            data: experience
        })
    }

    async update({ auth, params, request, response }: HttpContext) {
        const user = auth.user!
        const experience = await EmployeeExperience.query()
            .where('id', params.id)
            .where('employee_id', user.id)
            .first()

        if (!experience) {
            return response.notFound({ status: 'error', message: 'Experience not found' })
        }

        const data = await request.validateUsing(EmployeeExperiencesController.validator)
        experience.merge(data)
        await experience.save()

        return response.ok({
            status: 'success',
            data: experience
        })
    }

    async destroy({ auth, params, response }: HttpContext) {
        const user = auth.user!
        const experience = await EmployeeExperience.query()
            .where('id', params.id)
            .where('employee_id', user.id)
            .first()

        if (!experience) {
            return response.notFound({ status: 'error', message: 'Experience not found' })
        }

        await experience.delete()

        return response.ok({
            status: 'success',
            message: 'Experience deleted'
        })
    }
}
