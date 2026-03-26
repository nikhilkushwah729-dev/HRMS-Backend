import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'

export default class Geofence extends BaseModel {
    static table = 'geofences'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column()
    declare name: string

    @column()
    declare latitude: number

    @column()
    declare longitude: number

    @column({ columnName: 'radius_meters' })
    declare radiusMeters: number

    @column()
    declare address: string | null

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    /**
     * Check if a point is within the geofence
     */
    isWithinBounds(lat: number, lng: number): boolean {
        // Simple distance calculation using Haversine formula
        const R = 6371000 // Earth's radius in meters
        const dLat = this.toRad(lat - this.latitude)
        const dLon = this.toRad(lng - this.longitude)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(this.latitude)) * Math.cos(this.toRad(lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        return distance <= this.radiusMeters
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180)
    }
}

