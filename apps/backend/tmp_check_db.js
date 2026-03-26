import mysql from 'mysql2/promise';
import fs from 'fs';

async function run() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '',
        database: 'hrms_complete'
    });

    try {
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        const [columns] = await connection.query('DESCRIBE audit_logs');
        const [migrations] = await connection.query('SELECT name, batch FROM adonis_schema ORDER BY id DESC LIMIT 100');

        const result = {
            tables: tableNames,
            columns: columns.map(c => ({ name: c.Field, type: c.Type })),
            migrations: migrations.map(m => ({ batch: m.batch, name: m.name }))
        };

        fs.writeFileSync('tmp_db_result.json', JSON.stringify(result, null, 2));
        console.log('Results written to tmp_db_result.json');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

run();
