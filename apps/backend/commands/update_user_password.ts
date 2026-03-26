import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

export default class UpdateUserPassword extends BaseCommand {
  static commandName = 'update:user-password'
  static description = 'Update and hash a user password'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'The email or ID of the user' })
  declare identifier: string

  @args.string({ description: 'The new plain text password' })
  declare password: string

  async run() {
    let userData: any = null

    if (!isNaN(Number(this.identifier))) {
      userData = await db.from('employees').where('id', this.identifier).first()
    } else {
      userData = await db.from('employees').where('email', this.identifier).first()
    }

    if (!userData) {
      this.logger.error(`User with identifier "${this.identifier}" not found`)
      return
    }

    const hashedPassword = await hash.make(this.password)

    await db.from('employees')
      .where('id', userData.id)
      .update({
        password_hash: hashedPassword
      })

    this.logger.success(`Password for user "${userData.email}" (ID: ${userData.id}) has been updated and hashed directly in DB.`)
  }
}