import type { HttpContext } from '@adonisjs/core/http'
import Country from '#models/country'

export default class CountriesController {
    async index({ response }: HttpContext) {
        const countries = await Country.query()
            .where('is_active', true)
            .orderBy('name', 'asc')

        return response.ok(countries)
    }
}
