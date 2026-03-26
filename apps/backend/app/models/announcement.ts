import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Department from '#models/department'
import Role from '#models/role'

export default class Announcement extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare createdBy: number

    @column()
    declare title: string

    @column()
    declare content: string

    @column()
    declare target: 'all' | 'department' | 'role'

    @column()
    declare targetId: number | null

    @column.dateTime()
    declare publishedAt: DateTime

    @column.dateTime()
    declare expiresAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'createdBy' })
    declare creator: BelongsTo<typeof Employee>

    @belongsTo(() => Department, { foreignKey: 'targetId' })
    declare department: BelongsTo<typeof Department>

    @belongsTo(() => Role, { foreignKey: 'targetId' })
    declare role: BelongsTo<typeof Role>
}