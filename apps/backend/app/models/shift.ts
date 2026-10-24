import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import EmployeeShift from '#models/employee_shift'

export default class Shift extends BaseModel {
    static table = 'shifts'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'shift_name' })
    declare name: string

    @column({ columnName: 'start_time' })
    declare startTime: string // TIME in SQL (HH:mm:ss)

    @column({ columnName: 'end_time' })
    declare endTime: string // TIME in SQL (HH:mm:ss)

    @column({ columnName: 'grace_minutes' })
    declare graceTime: number

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @hasMany(() => EmployeeShift)
    declare employeeShifts: HasMany<typeof EmployeeShift>
}