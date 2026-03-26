import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from '#models/role'

export default class Permission extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare permissionKey: string

    @column()
    declare description: string | null

    @column()
    declare module: string | null

    // Relationships
    @manyToMany(() => Role, {
        pivotTable: 'role_permissions',
        pivotForeignKey: 'permission_id',
        pivotRelatedForeignKey: 'role_id',
    })
    declare roles: ManyToMany<typeof Role>
}