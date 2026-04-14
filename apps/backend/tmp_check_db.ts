// @ts-nocheck
import db from '@adonisjs/lucid/services/db'
import app from '@adonisjs/core/services/app'

async function run() {
    await app.boot()

    try {
        console.log('Checking audit_logs table...')
        const columns = await db.from('audit_logs').columnInfo()
        console.log(
            'Columns in audit_logs:',
            Object.entries(columns)
                .map(([name, info]: [string, any]) => (info.defaultValue ? `${name} (def: ${info.defaultValue})` : name))
                .join(', ')
        )

        console.log('\nChecking adonis_schema table...')
        const migrations = await db.from('adonis_schema').select('*').orderBy('id', 'desc').limit(20)
        console.table(migrations)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await db.manager.closeAll()
    }
}

run()
