import mysql from 'mysql2/promise';

async function main() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        port: 3307,
        password: '',
        database: 'hrms_complete'
    });

    try {
        // Drop existing table
        await connection.execute('DROP TABLE IF EXISTS `auth_access_tokens`');

        // Create with correct foreign key
        await connection.execute(`
      CREATE TABLE \`auth_access_tokens\` (
        \`id\` int unsigned NOT NULL AUTO_INCREMENT,
        \`tokenable_id\` int unsigned NOT NULL,
        \`type\` varchar(255) NOT NULL,
        \`name\` varchar(255) DEFAULT NULL,
        \`hash\` varchar(255) NOT NULL,
        \`abilities\` text NOT NULL,
        \`created_at\` timestamp NULL DEFAULT NULL,
        \`updated_at\` timestamp NULL DEFAULT NULL,
        \`last_used_at\` timestamp NULL DEFAULT NULL,
        \`expires_at\` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`auth_access_tokens_tokenable_id_foreign\` (\`tokenable_id\`),
        CONSTRAINT \`auth_access_tokens_tokenable_id_foreign\` FOREIGN KEY (\`tokenable_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('Successfully created auth_access_tokens referencing employees');

    } catch (err) {
        console.error('Error creating table:', err.message);
    }
    process.exit(0);
}
main().catch(console.error);
