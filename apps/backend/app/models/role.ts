import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Permission from '#models/permission'

export default class Role extends BaseModel {
    static table = 'roles'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number | null

    @column({ columnName: 'role_name' })
    declare roleName: string

    @column()
    declare description: string | null

    @column({ columnName: 'parent_role_id' })
    declare parentRoleId: number | null

    @column({ columnName: 'is_system' })
    declare isSystem: boolean

    @column()
    declare priority: number

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Role, { foreignKey: 'parentRoleId' })
    declare parentRole: BelongsTo<typeof Role>

    @hasMany(() => Employee, { foreignKey: 'roleId' })
    declare employees: HasMany<typeof Employee>

    @manyToMany(() => Permission, {
        pivotTable: 'role_permissions',
        pivotForeignKey: 'role_id',
        pivotRelatedForeignKey: 'permission_id',
    })
    declare permissions: ManyToMany<typeof Permission>
}
