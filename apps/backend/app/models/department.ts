import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Designation from '#models/designation'

export default class Department extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare parentId: number | null

    @column()
    declare departmentName: string

    @column()
    declare description: string | null

    @column()
    declare isActive: boolean

    @column.dateTime()
    declare deletedAt: DateTime | null

    // Relationships
    @belongsTo(() => Organization)
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Department, { foreignKey: 'parentId' })
    declare parent: BelongsTo<typeof Department>

    @hasMany(() => Department, { foreignKey: 'parentId' })
    declare children: HasMany<typeof Department>

    @hasMany(() => Designation)
    declare designations: HasMany<typeof Designation>

    @hasMany(() => Employee)
    declare employees: HasMany<typeof Employee>
}