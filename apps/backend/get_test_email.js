import Employee from './app/models/employee.js'
import { Ignitor } from '@adonisjs/core'

async function getEmail() {
    const ignitor = new Ignitor(new URL('./', import.meta.url), { environment: 'web' })
    const app = ignitor.createApp()
    await app.init()
    await app.boot()

    const employee = await Employee.first()
    if (employee) {
        console.log('FOUND_EMAIL:' + employee.email)
    } else {
        console.log('NO_EMPLOYEE_FOUND')
    }

    await app.terminate()
    process.exit(0)
}

getEmail().catch(console.error)
