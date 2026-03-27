import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Task from '#models/task'

export default class Project extends BaseModel {
    static table = 'projects'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column()
    declare name: string

    @column()
    declare description: string | null

    @column({ columnName: 'client_name' })
    declare clientName: string | null

    @column.date()
    declare startDate: DateTime | null

    @column.date()
    declare endDate: DateTime | null

    @column()
    declare budget: number | null

    @column()
    declare status: 'planned' | 'in_progress' | 'completed' | 'on_hold'

    @column()
    declare priority: 'low' | 'medium' | 'high' | 'critical'

    @column.dateTime({ columnName: 'deleted_at' })
    declare deletedAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => Task, { foreignKey: 'projectId' })
    declare tasks: HasMany<typeof Task>
}
