import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

async function check() {
    try {
        await db.rawQuery(`
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
        CONSTRAINT \`auth_access_tokens_tokenable_id_foreign\` FOREIGN KEY (\`tokenable_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
        console.log('Successfully created auth_access_tokens');

        // Add to adonis_schema so it is marked as migrated
        await db.rawQuery(`
      INSERT INTO adonis_schema (name, batch, migration_time)
      VALUES ('database/migrations/1768620764696_create_access_tokens_table', 1, CURRENT_TIMESTAMP);
    `);
        console.log('Added to adonis_schema');

    } catch (err) {
        console.error('Error creating table:', err.message);
    }
}

check().finally(() => process.exit(0))
