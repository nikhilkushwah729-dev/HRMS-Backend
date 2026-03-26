import Timesheet from '#models/timesheet'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'

export default class TimesheetService {
    async list(employeeId: number, orgId: number) {
        return await Timesheet.query()
            .where('employee_id', employeeId)
            .where('org_id', orgId)
            .orderBy('work_date', 'desc')
    }

    async create(employeeId: number, orgId: number, data: any) {
        return await Timesheet.create({ ...data, employeeId, orgId })
    }
}
