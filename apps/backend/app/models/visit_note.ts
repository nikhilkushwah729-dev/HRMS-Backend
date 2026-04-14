import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class VisitNote extends BaseModel {
  static table = 'visit_notes'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'visit_id' })
  declare visitId: number

  @column({ columnName: 'org_id' })
  declare orgId: number

  @column({ columnName: 'employee_id' })
  declare employeeId: number | null

  @column({ columnName: 'note_type' })
  declare noteType: string

  @column()
  declare content: string

  @column({ columnName: 'attachment_urls' })
  declare attachmentUrls: string | null

  @column({ columnName: 'photo_proof_url' })
  declare photoProofUrl: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
