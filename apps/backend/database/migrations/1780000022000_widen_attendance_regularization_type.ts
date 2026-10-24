import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'attendance_regularizations'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) {
      return
    }

    if (!this.db.dialect.name.includes('sqlite') && process.env.DB_CONNECTION !== 'sqlite') {
      this.schema.raw(`ALTER TABLE ${this.tableName} MODIFY \`type\` VARCHAR(50) NOT NULL DEFAULT 'missed_punch'`)
    } else {
      await this.db.rawQuery('PRAGMA foreign_keys=OFF;')
      await this.db.rawQuery(`
        CREATE TABLE attendance_regularizations_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          attendance_id INTEGER REFERENCES attendances(id) ON DELETE SET NULL,
          regularization_date DATE NOT NULL,
          check_in TIME,
          check_out TIME,
          type VARCHAR(50) NOT NULL DEFAULT 'missed_punch',
          reason TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          admin_notes TEXT,
          rejection_reason TEXT,
          approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          approved_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )
      `)
      await this.db.rawQuery(`INSERT INTO attendance_regularizations_temp SELECT * FROM attendance_regularizations;`)
      await this.db.rawQuery(`DROP TABLE attendance_regularizations;`)
      await this.db.rawQuery(`ALTER TABLE attendance_regularizations_temp RENAME TO attendance_regularizations;`)
      await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS attendance_regularizations_employee_id_index ON attendance_regularizations (employee_id);`)
      await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS attendance_regularizations_org_id_index ON attendance_regularizations (org_id);`)
      await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS attendance_regularizations_status_index ON attendance_regularizations (status);`)
      await this.db.rawQuery('PRAGMA foreign_keys=ON;')
    }
  }

  async down() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) {
      return
    }

    if (!this.db.dialect.name.includes('sqlite') && process.env.DB_CONNECTION !== 'sqlite') {
      // Safely preserve new regularization types before reverting to 4-member ENUM to prevent data truncation
      await this.db.rawQuery(
        `UPDATE ${this.tableName} SET reason = CONCAT('[Type Reverted from: ', \`type\`, '] ', reason), \`type\` = 'other' WHERE \`type\` NOT IN ('missed_punch', 'late_arrival', 'half_day', 'other')`
      )
      this.schema.raw(`ALTER TABLE ${this.tableName} MODIFY \`type\` ENUM('missed_punch', 'late_arrival', 'half_day', 'other') NOT NULL DEFAULT 'missed_punch'`)
    } else {
      await this.db.rawQuery(
        `UPDATE ${this.tableName} SET reason = '[Type Reverted from: ' || "type" || '] ' || reason, "type" = 'other' WHERE "type" NOT IN ('missed_punch', 'late_arrival', 'half_day', 'other')`
      )
      await this.db.rawQuery('PRAGMA foreign_keys=OFF;')
      await this.db.rawQuery(`
        CREATE TABLE attendance_regularizations_temp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          attendance_id INTEGER REFERENCES attendances(id) ON DELETE SET NULL,
          regularization_date DATE NOT NULL,
          check_in TIME,
          check_out TIME,
          type TEXT CHECK (type IN ('missed_punch', 'late_arrival', 'half_day', 'other')) NOT NULL DEFAULT 'missed_punch',
          reason TEXT NOT NULL,
          status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
          admin_notes TEXT,
          rejection_reason TEXT,
          approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
          approved_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP
        )
      `)
      await this.db.rawQuery(`INSERT INTO attendance_regularizations_temp SELECT * FROM attendance_regularizations;`)
      await this.db.rawQuery(`DROP TABLE attendance_regularizations;`)
      await this.db.rawQuery(`ALTER TABLE attendance_regularizations_temp RENAME TO attendance_regularizations;`)
      await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS attendance_regularizations_employee_id_index ON attendance_regularizations (employee_id);`)
      await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS attendance_regularizations_org_id_index ON attendance_regularizations (org_id);`)
      await this.db.rawQuery(`CREATE INDEX IF NOT EXISTS attendance_regularizations_status_index ON attendance_regularizations (status);`)
      await this.db.rawQuery('PRAGMA foreign_keys=ON;')
    }
  }
}
