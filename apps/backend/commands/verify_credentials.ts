import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Employee from '#models/employee'

export default class VerifyCredentials extends BaseCommand {
    static commandName = 'auth:verify'
    static description = 'Verify user credentials via Employee model'

    static options: CommandOptions = {
        startApp: true,
    }

    @args.string({ description: 'The email of the user' })
    declare email: string

    @args.string({ description: 'The password to verify' })
    declare password: string

    async run() {
        try {
            this.logger.info(`Attempting to verify credentials for: ${this.email}`)
            const user = await Employee.verifyCredentials(this.email, this.password)
            if (user) {
                this.logger.success(`Success! User ID: ${user.id}`)
            } else {
                this.logger.error('Invalid credentials')
            }
        } catch (error) {
            this.logger.error(`Failed: ${error.message}`)
            console.error('--- FULL ERROR START ---')
            console.error(error)
            if (error.stack) console.error(error.stack)
            console.error('--- FULL ERROR END ---')
        }
    }
}
