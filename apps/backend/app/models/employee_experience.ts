import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'

export default class EmployeeExperience extends BaseModel {
    public static table = 'employee_experience'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare companyName: string

    @column()
    declare role: string

    @column()
    declare location: string | null

    @column()
    declare startDate: string // Using string for simple date handling if preferred, or DateTime

    @column()
    declare endDate: string | null

    @column()
    declare isCurrent: boolean

    @column()
    declare description: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>
}
