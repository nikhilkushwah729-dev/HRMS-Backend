import { Ignitor } from '@adonisjs/core/ignitor'
import Employee from './app/models/employee.js'

const ignitor = new Ignitor(new URL('./', import.meta.url), {
    appKey: process.env.APP_KEY,
    common: {
        useAsyncStackTraces: true,
    },
})

async function run() {
    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    try {
        const user = await Employee.find(1)
        if (!user) {
            console.error('User with ID 1 not found')
            return
        }

        user.passwordHash = 'password123'
        await user.save()
        console.log('Password updated and hashed for user ID 1')
    } catch (error) {
        console.error('Error updating password:', error)
    } finally {
        await app.terminate()
    }
}

run()
