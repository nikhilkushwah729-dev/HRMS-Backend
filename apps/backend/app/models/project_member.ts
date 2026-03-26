import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import Employee from '#models/employee'

export default class ProjectMember extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare projectId: number

    @column()
    declare employeeId: number

    @column()
    declare role: string | null

    @column.dateTime({ autoCreate: true })
    declare joinedAt: DateTime

    // Relationships
    @belongsTo(() => Project, { foreignKey: 'projectId' })
    declare project: BelongsTo<typeof Project>

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>
}