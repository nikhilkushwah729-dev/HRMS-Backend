import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Plan from '#models/plan'
import Organization from '#models/organization'

export default class OrgRegistration extends BaseModel {
    static table = 'org_registrations'

    @column({ isPrimary: true })
    declare id: number

    @column()
    declare companyName: string

    @column()
    declare email: string

    @column()
    declare phone: string | null

    @column()
    declare country: string | null

    @column()
    declare countryCode: string | null

    @column()
    declare countryName: string | null

    @column()
    declare dialCode: string | null

    @column()
    declare adminFirstName: string | null

    @column()
    declare adminLastName: string | null

    @column({ serializeAs: null })
    declare adminPasswordHash: string | null

    @column()
    declare planId: number | null

    @column()
    declare emailToken: string | null

    @column.dateTime()
    declare emailTokenExpires: DateTime | null

    @column()
    declare phoneOtpHash: string | null

    @column.dateTime()
    declare phoneOtpExpires: DateTime | null

    @column()
    declare stepCompleted: number

    @column()
    declare status: 'pending' | 'email_verified' | 'phone_verified' | 'active' | 'rejected' | 'expired'

    @column()
    declare orgId: number | null

    @column.dateTime()
    declare approvedAt: DateTime | null

    @column()
    declare rejectionReason: string | null

    @column()
    declare ipAddress: string | null

    @column()
    declare userAgent: string | null

    @column.dateTime()
    declare expiresAt: DateTime

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @belongsTo(() => Plan)
    declare plan: BelongsTo<typeof Plan>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>
}