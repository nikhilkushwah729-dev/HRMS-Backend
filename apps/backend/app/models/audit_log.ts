import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeUpdate, beforeDelete, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'

export default class AuditLog extends BaseModel {
    static table = 'audit_logs'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number | null

    @column({ columnName: 'user_id' })
    declare userId: number | null

    @column({ columnName: 'employee_id' })
    declare employeeId: number | null

    @column()
    declare action: string

    @column()
    declare module: string

    @column({ columnName: 'entity_type' })
    declare entityType: string | null

    @column({ columnName: 'entity_name' })
    declare entityName: string | null

    @column({ columnName: 'entity_id' })
    declare entityId: string | null

    @column()
    declare description: string | null

    @column({
        columnName: 'old_values',
        prepare: (value) => (value ? (typeof value === 'string' ? value : JSON.stringify(value)) : null),
        consume: (value) => {
            if (!value) return null
            if (typeof value === 'object') return value
            try {
                return JSON.parse(value)
            } catch {
                return value
            }
        },
    })
    declare oldValues: any

    @column({
        columnName: 'new_values',
        prepare: (value) => (value ? (typeof value === 'string' ? value : JSON.stringify(value)) : null),
        consume: (value) => {
            if (!value) return null
            if (typeof value === 'object') return value
            try {
                return JSON.parse(value)
            } catch {
                return value
            }
        },
    })
    declare newValues: any

    @column({ columnName: 'ip_address' })
    declare ipAddress: string | null

    @column({ columnName: 'user_agent' })
    declare userAgent: string | null

    @column({ columnName: 'request_method' })
    declare requestMethod: string | null

    @column({ columnName: 'request_url' })
    declare requestUrl: string | null

    @column()
    declare status: string

    @column({ columnName: 'country_code' })
    declare countryCode: string | null

    @column({ columnName: 'country_name' })
    declare countryName: string | null

    @column({ columnName: 'region_name' })
    declare regionName: string | null

    @column({ columnName: 'city_name' })
    declare cityName: string | null

    @column()
    declare latitude: number | null

    @column()
    declare longitude: number | null

    @column({ columnName: 'is_immutable' })
    declare isImmutable: boolean

    @column.dateTime({ autoCreate: true, columnName: 'created_at' })
    declare createdAt: DateTime

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'userId' })
    declare user: BelongsTo<typeof Employee>

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @beforeSave()
    static async syncUserEmployee(auditLog: AuditLog) {
        if (auditLog.userId && !auditLog.employeeId) {
            auditLog.employeeId = auditLog.userId
        } else if (auditLog.employeeId && !auditLog.userId) {
            auditLog.userId = auditLog.employeeId
        }

        if (auditLog.entityType && !auditLog.entityName) {
            auditLog.entityName = auditLog.entityType
        } else if (auditLog.entityName && !auditLog.entityType) {
            auditLog.entityType = auditLog.entityName
        }

        if (!auditLog.status) {
            auditLog.status = 'success'
        }
    }

    @beforeUpdate()
    static async preventUpdate() {
        throw new Error('Audit logs are immutable and cannot be updated.')
    }

    @beforeDelete()
    static async preventDelete() {
        throw new Error('Audit logs are immutable and cannot be deleted.')
    }
}