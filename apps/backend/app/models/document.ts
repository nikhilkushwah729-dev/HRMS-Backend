import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Organization from '#models/organization'
import Employee from '#models/employee'

export default class Document extends BaseModel {
    @column({ isPrimary: true })
    declare id: number

    @column()
    declare orgId: number

    @column()
    declare employeeId: number | null

    @column()
    declare title: string

    @column({ columnName: 'file_name' })
    declare fileName: string | null

    @column({ columnName: 'file_path' })
    declare filePath: string | null

    @column()
    declare fileUuid: string

    @column()
    declare fileType: string | null

    @column()
    declare fileSizeKb: number | null

    @column()
    declare mimeType: string | null

    @column()
    declare category: string | null

    @column()
    declare description: string | null

    @column()
    declare isPrivate: boolean

    @column()
    declare isEncrypted: boolean

    @column()
    declare checksum: string | null

    @column()
    declare uploadedBy: number | null

    @column.dateTime()
    declare deletedAt: DateTime | null

    @column.dateTime({ autoCreate: true })
    declare createdAt: DateTime

    // Relationships
    @belongsTo(() => Organization, { foreignKey: 'orgId' })
    declare organization: BelongsTo<typeof Organization>

    @belongsTo(() => Employee, { foreignKey: 'employeeId' })
    declare employee: BelongsTo<typeof Employee>

    @belongsTo(() => Employee, { foreignKey: 'uploadedBy' })
    declare uploader: BelongsTo<typeof Employee>
}
