import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'

export default class EmployeeEducation extends BaseModel {
    public static table = 'employee_education'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare institution: string

    @column()
    declare degree: string

    @column()
    declare fieldOfStudy: string | null

    @column()
    declare startDate: string | null

    @column()
    declare endDate: string | null

    @column()
    declare grade: string | null

    @column()
    declare description: string | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Employee)
    declare employee: BelongsTo<typeof Employee>
}
