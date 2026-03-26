import db from '@adonisjs/lucid/services/db'

async function check() {
    const tables = await db.rawQuery('SHOW TABLES')
    console.log('Tables:', tables[0])
    const migrations = await db.from('adonis_schema').select('*')
    console.log('Migrations:', migrations)
}
check().catch(console.error).finally(() => process.exit(0))
