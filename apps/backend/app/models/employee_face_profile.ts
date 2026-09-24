import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Employee from '#models/employee'
import Organization from '#models/organization'
import EncryptionService from '#services/EncryptionService'

export default class EmployeeFaceProfile extends BaseModel {
  static table = 'employee_face_profiles'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'employee_id' })
  declare employeeId: number

  @column({
    columnName: 'face_embedding',
    prepare: (value) => (typeof value === 'string' ? EncryptionService.encryptText(value) : EncryptionService.encryptJson(value)),
    consume: (value) => EncryptionService.decryptText(value) ?? value,
  })
  declare faceEmbedding: string

  @column({ columnName: 'reference_image_url' })
  declare referenceImageUrl: string | null

  @column()
  declare status: 'active' | 'inactive' | 'pending' | 'rejected'

  @column({ columnName: 'created_by' })
  declare createdBy: number | null

  @column({ columnName: 'approved_by' })
  declare approvedBy: number | null

  @column.dateTime({ columnName: 'approved_at' })
  declare approvedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Employee, { foreignKey: 'employeeId' })
  declare employee: BelongsTo<typeof Employee>

  @belongsTo(() => Organization, { foreignKey: 'orgId' })
  declare organization: BelongsTo<typeof Organization>

  getEmbeddingArray(): number[] {
    return EncryptionService.decryptJson<number[]>(this.faceEmbedding) ?? []
  }
}
