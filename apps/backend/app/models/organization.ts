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

    @column({ columnName: 'company_name' })
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

    @column({ columnName: 'postal_code' })
    declare postalCode: string | null

    @column()
    declare gstin: string | null // [S5] Encrypt at app layer

    @column()
    declare logo: string | null

    @column({ columnName: 'plan_id' })
    declare planId: number | null

    @column({ columnName: 'plan_status' })
    declare planStatus: boolean

    @column.date({ columnName: 'plan_end_date' })
    declare planEndDate: DateTime | null

    @column({ columnName: 'user_limit' })
    declare userLimit: number

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column({ columnName: 'is_verified' })
    declare isVerified: boolean

    @column({ columnName: 'verification_token' })
    declare verificationToken: string | null

    @column()
    declare timezone: string

    // Geofence settings
    @column({ columnName: 'geofence_enabled' })
    declare geofenceEnabled: boolean

    @column({ columnName: 'require_geofence_for_all' })
    declare requireGeofenceForAll: boolean

    @column({ columnName: 'default_geofence_id' })
    declare defaultGeofenceId: number | null

    // Organization type and localization
    @column({ columnName: 'org_type' })
    declare orgType: 'national' | 'international'

    @column({ columnName: 'default_language' })
    declare defaultLanguage: string

    @column({ columnName: 'allowed_login_methods' })
    declare allowedLoginMethods: string // Comma-separated: email,google,microsoft,phone

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Plan, { foreignKey: 'planId' })
    declare plan: BelongsTo<typeof Plan>

    @hasMany(() => Employee, { foreignKey: 'orgId' })
    declare employees: HasMany<typeof Employee>

    @hasMany(() => Department, { foreignKey: 'orgId' })
    declare departments: HasMany<typeof Department>
}
