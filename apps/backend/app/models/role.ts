import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'
import Permission from '#models/permission'

export default class Role extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number | null

    @column()
    declare roleName: string

    @column()
    declare isSystem: boolean

    // Relationships
    @belongsTo(() => Organization)
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => Employee)
    declare employees: HasMany<typeof Employee>

    @manyToMany(() => Permission, {
        pivotTable: 'role_permissions',
        pivotForeignKey: 'role_id',
        pivotRelatedForeignKey: 'permission_id',
    })
    declare permissions: ManyToMany<typeof Permission>
}