import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class EmployeeLocation extends BaseModel {
    static table = 'employee_locations'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column()
    declare latitude: number

    @column()
    declare longitude: number

    @column.dateTime({ autoCreate: true })
    declare capturedAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}

