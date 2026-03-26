import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class Task extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare projectId: number

    @column()
    declare orgId: number

    @column()
    declare assignedTo: number | null

    @column()
    declare title: string

    @column()
    declare description: string | null

    @column()
    declare priority: 'low' | 'medium' | 'high' | 'critical'

    @column()
    declare status: 'todo' | 'in_progress' | 'testing' | 'completed' | 'cancelled' | 'on_hold'

    @column.date()
    declare dueDate: DateTime | null

    @column()
    declare estimatedHours: number | null

    @column()
    declare actualHours: number | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Project, { foreignKey: 'projectId' })
    declare project: BelongsTo<typeof Project>

    @belongsTo(() => Employee, { foreignKey: 'assignedTo' })
    declare assignee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}