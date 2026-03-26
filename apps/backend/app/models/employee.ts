import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, belongsTo, computed, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { type AccessToken, DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Organization from '#models/organization'
import Department from '#models/department'
import Designation from '#models/designation'
import Role from '#models/role'
import Geofence from '#models/geofence'

import { withSoftDelete } from '#models/Mixins/SoftDelete'
import { withAuditLog } from '#models/Mixins/AuditLog'

export default class Employee extends withSoftDelete(withAuditLog(BaseModel)) {
    static table = 'employees'
    static accessTokens = DbAccessTokensProvider.forModel(Employee)
    declare currentAccessToken?: AccessToken

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'department_id' })
    declare departmentId: number | null

    @column({ columnName: 'designation_id' })
    declare designationId: number | null

    @column({ columnName: 'role_id' })
    declare roleId: number | null

    @column({ columnName: 'geofence_id' })
    declare geofenceId: number | null

    @column({ columnName: 'manager_id' })
    declare managerId: number | null

    @column({ columnName: 'employee_code' })
    declare employeeCode: string | null

    @column()
    declare firstName: string

    @column()
    declare lastName: string | null

    @column()
    declare email: string | null

    @column()
    declare phone: string | null

    @column()
    declare phoneVerified: boolean

    @column()
    declare phoneAuthEnabled: boolean

    @column()
    declare loginType: 'email' | 'google' | 'microsoft' | 'phone'

    @column()
    declare isInternational: boolean

    @column({ columnName: 'country_code' })
    declare countryCode: string | null

    @column({ columnName: 'country_name' })
    declare countryName: string | null

    @column({ columnName: 'dial_code' })
    declare dialCode: string | null

    @column({ serializeAs: null })
    declare passwordHash: string | null

    @column()
    declare mustChangePassword: boolean

    @column()
    declare isLocked: boolean

    @column.dateTime()
    declare lockedUntil: DateTime | null

    @column()
    declare avatar: string | null

    @column()
    declare gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null

    @column.date()
    declare dateOfBirth: DateTime | null

    @column()
    declare address: string | null

    @column()
    declare emergencyContact: string | null

    @column()
    declare emergencyPhone: string | null

    @column()
    declare salary: number // ENCRYPT at app layer

    @column()
    declare bankAccount: string | null // ENCRYPT at app layer

    @column()
    declare bankName: string | null

    @column()
    declare ifscCode: string | null

    @column()
    declare panNumber: string | null // ENCRYPT at app layer

    @column()
    declare aadharLast4: string | null

    @column.date()
    declare joinDate: DateTime | null

    @column.date()
    declare exitDate: DateTime | null

    @column()
    declare exitReason: string | null

    @column()
    declare status: 'active' | 'inactive' | 'on_leave' | 'terminated'

    @column()
    declare emailVerified: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    @computed()
    get fullName() {
        return `${this.firstName} ${this.lastName || ''}`.trim()
    }

    @beforeSave()
    static async hashPassword(employee: Employee) {
        if (employee.$dirty.passwordHash && employee.passwordHash) {
            // Only hash if it's not already hashed (manual update in DB might have hashed it)
            // But usually we just hash what comes in dirty.
            if (!employee.passwordHash.startsWith('$')) {
                employee.passwordHash = await hash.make(employee.passwordHash)
            }
        }
    }

    static async verifyCredentials(email: string, plainTextPassword: string) {
        const user = await this.query().where('email', email).first()
        if (!user || !user.passwordHash) {
            return null
        }

        const verified = await hash.verify(user.passwordHash, plainTextPassword)
        if (!verified) {
            return null
        }

        return user
    }

    async verifyPassword(plainTextPassword: string) {
        if (!this.passwordHash) return false
        return hash.verify(this.passwordHash, plainTextPassword)
    }

    get initials() {
        return `${this.firstName.charAt(0)}${this.lastName ? this.lastName.charAt(0) : ''}`.toUpperCase()
    }

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Department, { foreignKey: 'departmentId' })
    declare department: BelongsTo<typeof Department>

    @belongsTo(() => Designation, { foreignKey: 'designationId' })
    declare designation: BelongsTo<typeof Designation>

    @belongsTo(() => Role, { foreignKey: 'roleId' })
    declare role: BelongsTo<typeof Role>

    @belongsTo(() => Employee, { foreignKey: 'managerId' })
    declare manager: BelongsTo<typeof Employee>

    @belongsTo(() => Geofence, { foreignKey: 'geofenceId' })
    declare geofence: BelongsTo<typeof Geofence>
}
