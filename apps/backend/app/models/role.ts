import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
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

    @column({ columnName: 'is_system' })
    declare isSystem: boolean

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => Employee, { foreignKey: 'roleId' })
    declare employees: HasMany<typeof Employee>

    @manyToMany(() => Permission, {
        pivotTable: 'role_permissions',
        pivotForeignKey: 'role_id',
        pivotRelatedForeignKey: 'permission_id',
    })
    declare permissions: ManyToMany<typeof Permission>
}
