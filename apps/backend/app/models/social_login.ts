import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'

export default class SocialLogin extends BaseModel {
    static table = 'social_logins'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare employeeId: number

    @column()
    declare provider: string

    @column()
    declare providerUserId: string

    @column()
    declare phone: string | null

    @column()
    declare isPrimary: boolean

    @column.dateTime()
    declare lastLoginAt: DateTime | null

    @column()
    declare profileData: object | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>
}
