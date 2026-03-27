import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Department from '#models/department'
import Employee from '#models/employee'

export default class Designation extends BaseModel {
    static table = 'designations'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'department_id' })
    declare departmentId: number | null

    @column({ columnName: 'designation_name' })
    declare designationName: string

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Department, { foreignKey: 'departmentId' })
    declare department: BelongsTo<typeof Department>

    @hasMany(() => Employee, { foreignKey: 'designationId' })
    declare employees: HasMany<typeof Employee>
}
