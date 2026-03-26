import mysql from 'mysql2/promise';

async function run() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: '',
        database: 'hrms_complete'
    });

    try {
        console.log('Fixing audit_logs table...');

        // Check if module exists
        const [columns] = await connection.query('DESCRIBE audit_logs');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('module')) {
            console.log('Adding module column...');
            await connection.query('ALTER TABLE audit_logs ADD COLUMN module VARCHAR(50) AFTER action');
        }

        if (columnNames.includes('entity_type') && !columnNames.includes('entity_name')) {
            console.log('Renaming entity_type to entity_name...');
            await connection.query('ALTER TABLE audit_logs CHANGE COLUMN entity_type entity_name VARCHAR(50)');
        }

        if (!columnNames.includes('is_immutable')) {
            console.log('Adding is_immutable column...');
            await connection.query('ALTER TABLE audit_logs ADD COLUMN is_immutable TINYINT(1) DEFAULT 1 NOT NULL');
        }

        // Ensure entity_id is VARCHAR if it's currently INT
        const entityIdCol = columns.find(c => c.Field === 'entity_id');
        if (entityIdCol && entityIdCol.Type.toLowerCase().includes('int')) {
            console.log('Changing entity_id to VARCHAR(50)...');
            await connection.query('ALTER TABLE audit_logs MODIFY COLUMN entity_id VARCHAR(50)');
        }

        console.log('Table audit_logs fixed successfully.');

    } catch (error) {
        console.error('Error fixing table:', error);
    } finally {
        await connection.end();
    }
}

run();
