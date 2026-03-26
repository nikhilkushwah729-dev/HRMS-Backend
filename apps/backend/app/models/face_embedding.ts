import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'

export default class FaceEmbedding extends BaseModel {
    static table = 'face_embeddings'

    @column({ isPrimary: true })
    declare id: number

    @column({ columnName: 'employee_id' })
    declare employeeId: number

    @column({ columnName: 'org_id' })
    declare orgId: number

    @column({ columnName: 'embedding' })
    declare embedding: string // JSON string of embedding array

    @column({ columnName: 'image_url' })
    declare imageUrl: string | null

    @column({ columnName: 'is_active' })
    declare isActive: boolean

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    @column.dateTime({ autoCreate: true, autoUpdate: true })
    declare updatedAt: DateTime

    // Relationships
    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    // Helper method to get embedding as array
    getEmbeddingArray(): number[] {
        try {
            return JSON.parse(this.embedding)
        } catch {
            return []
        }
    }
}

