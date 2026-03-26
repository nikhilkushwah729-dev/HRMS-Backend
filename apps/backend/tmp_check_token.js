import { Ignitor } from '@adonisjs/core/ignitor'
import Employee from './app/models/employee.js'

const ignitor = new Ignitor(new URL('./', import.meta.url), {
    appKey: process.env.APP_KEY,
})

async function run() {
    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    try {
        const email = 'rahul.sharma@example.in'
        const user = await Employee.findBy('email', email)
        if (user) {
            const token = await Employee.accessTokens.create(user, ['*'], {
                expiresIn: '1 day'
            })
            console.log('--- TOKEN OBJECT ---')
            console.log(token)
            console.log('--- SERIALIZED TOKEN ---')
            console.log(JSON.stringify({ token: token }, null, 2))
        } else {
            console.log('User not found')
        }
    } catch (error) {
        console.error('Script Error:', error)
    } finally {
        await app.terminate()
    }
}

run()
