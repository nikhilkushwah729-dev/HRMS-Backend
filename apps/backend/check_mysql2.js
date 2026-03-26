import mysql from 'mysql2/promise';
import fs from 'fs';

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: 3307,
        password: '',
        database: 'hrms_complete'
    });
    const [rows] = await connection.execute('SHOW TABLES');
    const [tables] = await connection.execute('SELECT * FROM adonis_schema');

    const result = {
        tables: rows,
        migrations: tables
    };
    fs.writeFileSync('db_out.json', JSON.stringify(result, null, 2), 'utf-8');
    process.exit(0);
}
main().catch(console.error);
