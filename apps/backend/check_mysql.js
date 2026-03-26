import mysql from 'mysql2/promise';

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: 3307,
        password: '',
        database: 'hrms_complete'
    });
    const [rows] = await connection.execute('SHOW TABLES');
    console.log(rows);
    const [tables] = await connection.execute('SELECT * FROM adonis_schema');
    console.log('Migrations:');
    console.log(tables.map(t => t.name).join('\n'));
    process.exit(0);
}
main().catch(console.error);
