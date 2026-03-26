import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import Role from '#models/role'

export default class EmployeeInvitation extends BaseModel {
    static table = 'employee_invitations'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column()
    declare email: string

    @column()
    declare token: string

    @column({ columnName: 'role_id' })
    declare roleId: number | null

    @column()
    declare status: 'pending' | 'accepted' | 'expired' | 'revoked'

    @column.dateTime()
    declare expiresAt: DateTime

    @column({ columnName: 'invited_by' })
    declare invitedBy: number | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Role, { foreignKey: 'roleId' })
    declare role: BelongsTo<typeof Role>

    @belongsTo(() => Employee, { foreignKey: 'invitedBy' })
    declare inviter: BelongsTo<typeof Employee>
}
