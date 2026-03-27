import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Designation from '#models/designation'

export default class Department extends BaseModel {
    static table = 'departments'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'parent_id' })
    declare parentId: number | null

    @column({ columnName: 'department_name' })
    declare departmentName: string

    @column()
    declare description: string | null

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column.dateTime({ columnName: 'deleted_at' })
    declare deletedAt: DateTime | null

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Department, { foreignKey: 'parentId' })
    declare parent: BelongsTo<typeof Department>

    @hasMany(() => Department, { foreignKey: 'parentId' })
    declare children: HasMany<typeof Department>

    @hasMany(() => Designation, { foreignKey: 'departmentId' })
    declare designations: HasMany<typeof Designation>

    @hasMany(() => Employee, { foreignKey: 'departmentId' })
    declare employees: HasMany<typeof Employee>
}
