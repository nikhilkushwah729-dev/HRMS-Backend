import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import Task from '#models/task'

export default class Timesheet extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare orgId: number

    @column()
    declare taskId: number | null

    @column.date()
    declare workDate: DateTime

    @column()
    declare durationMinutes: number

    @column()
    declare description: string | null

    @column()
    declare status: 'draft' | 'submitted' | 'approved' | 'rejected'

    @column()
    declare approvedBy: number | null

    @column.dateTime()
    declare approvedAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Task, { foreignKey: 'taskId' })
    declare task: BelongsTo<typeof Task>

    @belongsTo(() => Employee, { foreignKey: 'approvedBy' })
    declare approver: BelongsTo<typeof Employee>
}