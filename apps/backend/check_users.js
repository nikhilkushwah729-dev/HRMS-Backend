import mysql from 'mysql2/promise';

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: 3307,
        password: '',
        database: 'hrms_complete'
    });

    const [rows] = await connection.execute('SELECT * FROM users');
    console.log('Users count:', rows.length);
    if (rows.length > 0) {
        console.log('First user:', rows[0]);
    }

    process.exit(0);
}
main().catch(console.error);
