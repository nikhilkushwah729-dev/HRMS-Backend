import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import EncryptionService from '#services/EncryptionService'

export default class EncryptLegacyPii extends BaseCommand {
  static commandName = 'encrypt:legacy-pii'
  static description = 'Draft batch migration script to encrypt unencrypted legacy PII data with enc:v1: prefix'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Starting legacy PII data encryption migration preview...')

    // 1. Fetch unencrypted Employee PII records
    const employees = await db
      .from('employees')
      .whereNotNull('pan_number')
      .orWhereNotNull('bank_account')

    this.logger.info(`Found ${employees.length} employee records with potential PII data`)

    let updatedCount = 0

    for (const emp of employees) {
      const updates: Record<string, string | null> = {}

      // PAN Number migration
      if (emp.pan_number && !emp.pan_number.startsWith('enc:v1:')) {
        updates.pan_number = EncryptionService.encryptText(emp.pan_number)
      }

      // Bank Account migration
      if (emp.bank_account && !emp.bank_account.startsWith('enc:v1:')) {
        updates.bank_account = EncryptionService.encryptText(emp.bank_account)
      }

      if (Object.keys(updates).length > 0) {
        await db.from('employees').where('id', emp.id).update(updates)
        updatedCount++
      }
    }

    this.logger.success(`Successfully migrated ${updatedCount} employee PII records to enc:v1: ciphertext`)
  }
}
