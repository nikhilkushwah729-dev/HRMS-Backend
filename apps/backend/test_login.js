import { Ignitor } from '@adonisjs/core/ignitor'
import Employee from './app/models/employee.js'
import hash from '@adonisjs/core/services/hash'

const ignitor = new Ignitor(new URL('./', import.meta.url), {
    appKey: process.env.APP_KEY,
})

async function run() {
    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    try {
        const email = 'rahul.sharma@example.in'
        const password = 'password123'

        console.log(`Attempting login for: ${email}`)

        // Check if user exists first
        const user = await Employee.findBy('email', email)
        if (!user) {
            console.log('User not found by email')
        } else {
            console.log(`User found: ID ${user.id}`)
            console.log(`Password Hash in DB: ${user.passwordHash}`)

            try {
                const verified = await Employee.verifyCredentials(email, password)
                console.log('Login SUCCESSFUL via verifyCredentials')
            } catch (e) {
                console.log(`Login FAILED: ${e.message}`)
                if (e.code) console.log(`Error Code: ${e.code}`)
            }
        }
    } catch (error) {
        console.error('Script Error:', error)
    } finally {
        await app.terminate()
    }
}

run()
