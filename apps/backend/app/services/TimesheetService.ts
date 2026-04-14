import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class TimesheetService {
    async list(employeeId: number, orgId: number) {
        const rows = await db
            .from('timesheets as t')
            .leftJoin('projects as p', 'p.id', 't.project_id')
            .where('t.employee_id', employeeId)
            .where('t.org_id', orgId)
            .select(
                't.id',
                't.employee_id',
                't.org_id',
                't.project_id',
                't.task_id',
                't.log_date',
                't.hours_logged',
                't.description',
                't.created_at',
                'p.name as project_name'
            )
            .orderBy('t.log_date', 'desc')

        return rows.map((row) => ({
            id: Number(row.id),
            employee_id: Number(row.employee_id),
            project_id: row.project_id ? Number(row.project_id) : null,
            task_id: row.task_id ? Number(row.task_id) : null,
            log_date: row.log_date,
            date: row.log_date,
            hours_logged: Number(row.hours_logged ?? 0),
            hours: Number(row.hours_logged ?? 0),
            description: row.description ?? null,
            status: 'submitted',
            created_at: row.created_at,
            project: row.project_name
                ? {
                    id: row.project_id ? Number(row.project_id) : 0,
                    name: row.project_name,
                }
                : null,
        }))
    }

    async create(employeeId: number, orgId: number, data: any) {
        const logDate = data.workDate || data.log_date || DateTime.now().toISODate()
        const hoursLogged = Number(data.hoursWorked ?? data.hours_logged ?? 0)

        const inserted = await db.table('timesheets').insert({
            employee_id: employeeId,
            org_id: orgId,
            project_id: data.projectId ?? data.project_id ?? null,
            task_id: data.taskId ?? data.task_id ?? null,
            log_date: logDate,
            hours_logged: hoursLogged,
            description: data.description ?? null,
            created_at: DateTime.now().toSQL(),
        })

        const insertedId = Array.isArray(inserted) ? inserted[0] : inserted
        const created = await db.from('timesheets').where('id', insertedId).first()
        return {
            id: Number(created.id),
            employee_id: Number(created.employee_id),
            project_id: created.project_id ? Number(created.project_id) : null,
            task_id: created.task_id ? Number(created.task_id) : null,
            log_date: created.log_date,
            date: created.log_date,
            hours_logged: Number(created.hours_logged ?? 0),
            hours: Number(created.hours_logged ?? 0),
            description: created.description ?? null,
            status: 'submitted',
            created_at: created.created_at,
        }
    }
}