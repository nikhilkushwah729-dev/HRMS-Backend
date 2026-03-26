import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Plan from '#models/plan'
import Employee from '#models/employee'
import Department from '#models/department'

import { withSoftDelete } from '#models/Mixins/SoftDelete'
import { withAuditLog } from '#models/Mixins/AuditLog'

const OrganizationBase = withAuditLog(withSoftDelete(BaseModel))

export default class Organization extends OrganizationBase {
    static table = 'organizations'
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare companyName: string

    @column()
    declare slug: string

    @column()
    declare email: string

    @column()
    declare phone: string | null

    @column()
    declare address: string | null

    @column()
    declare city: string | null

    @column()
    declare state: string | null

    @column()
    declare country: string | null

    @column()
    declare countryCode: string | null

    @column()
    declare countryName: string | null

    @column()
    declare dialCode: string | null

    @column()
    declare postalCode: string | null

    @column()
    declare gstin: string | null // [S5] Encrypt at app layer

    @column()
    declare logo: string | null

    @column()
    declare planId: number | null

    @column()
    declare planStatus: boolean

    @column.date()
    declare planEndDate: DateTime | null

    @column()
    declare userLimit: number

    @column()
    declare isActive: boolean

    @column()
    declare isVerified: boolean

    @column()
    declare verificationToken: string | null

    @column()
    declare timezone: string

    // Geofence settings
    @column()
    declare geofenceEnabled: boolean

    @column()
    declare requireGeofenceForAll: boolean

    @column()
    declare defaultGeofenceId: number | null

    // Organization type and localization
    @column()
    declare orgType: 'national' | 'international'

    @column()
    declare defaultLanguage: string

    @column()
    declare allowedLoginMethods: string // Comma-separated: email,google,microsoft,phone

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Plan)
    declare plan: BelongsTo<typeof Plan>

    @hasMany(() => Employee)
    declare employees: HasMany<typeof Employee>

    @hasMany(() => Department)
    declare departments: HasMany<typeof Department>
}
