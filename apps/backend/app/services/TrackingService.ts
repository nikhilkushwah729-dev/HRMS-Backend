import { inject } from '@adonisjs/core'
import EmployeeLocation from '#models/employee_location'

@inject()
export default class TrackingService {
    async updateLocation(employeeId: number, orgId: number, data: { latitude: number, longitude: number }) {
        return await EmployeeLocation.create({
            employeeId,
            orgId,
            latitude: data.latitude,
            longitude: data.longitude
        })
    }

    async getHistory(employeeId: number, orgId: number) {
        return await EmployeeLocation.query()
            .where('employee_id', employeeId)
            .where('org_id', orgId)
            .orderBy('captured_at', 'desc')
            .limit(100)
    }
}
