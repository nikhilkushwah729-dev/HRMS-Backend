import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Department from '#models/department'
import Employee from '#models/employee'

export default class Designation extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare departmentId: number | null

    @column()
    declare designationName: string

    // Relationships
    @belongsTo(() => Organization)
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Department)
    declare department: BelongsTo<typeof Department>

    @hasMany(() => Employee)
    declare employees: HasMany<typeof Employee>
}