import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'organizations'

  async up() {
    const hasDefaultGeofenceColumn = await this.schema.hasColumn(this.tableName, 'default_geofence_id')
    const hasGeofenceEnabledColumn = await this.schema.hasColumn(this.tableName, 'geofence_enabled')
    const hasManagerIdColumn = await this.schema.hasColumn('employees', 'manager_id')

    // Add slug to organizations (required for unique constraint)
    this.schema.alterTable(this.tableName, (table) => {
      table.string('slug', 100).notNullable().after('company_name').unique()
    })

    // Add geofence-related fields to organizations
    // Note: MySQL SET type is handled as VARCHAR with app-level validation
    if (!hasGeofenceEnabledColumn && !hasDefaultGeofenceColumn) {
      this.schema.alterTable(this.tableName, (table) => {
        table.boolean('geofence_enabled').defaultTo(false).after('updated_at')
        table.boolean('require_geofence_for_all').defaultTo(false).after('geofence_enabled')
        table.integer('default_geofence_id').unsigned().nullable().after('require_geofence_for_all')
        table.enum('org_type', ['national', 'international']).defaultTo('national').after('default_geofence_id')
        table.string('default_language', 10).defaultTo('en').after('org_type')
        // MySQL SET is stored as VARCHAR with app-level validation
        table.string('allowed_login_methods', 100).defaultTo('email,google,microsoft,phone').comment('Comma-separated: email,google,microsoft,phone').after('default_language')
      })
    }

    // Add missing fields to employees table
    if (!hasManagerIdColumn) {
      this.schema.alterTable('employees', (table) => {
        table.integer('manager_id').unsigned().nullable().after('role_id')
        table.boolean('phone_verified').notNullable().defaultTo(false).after('phone')
        table.boolean('phone_auth_enabled').notNullable().defaultTo(false).after('phone_verified')
        table.enum('login_type', ['email', 'google', 'microsoft', 'phone']).defaultTo('email').after('phone_auth_enabled')
        table.boolean('is_international').notNullable().defaultTo(false).after('login_type')
      })

      // Add foreign key for manager_id (self-referencing)
      this.schema.alterTable('employees', (table) => {
        table.foreign('manager_id').references('id').inTable('employees').onDelete('SET NULL')
      })

      // Add index for manager_id
      this.schema.alterTable('employees', (table) => {
        table.index(['manager_id'], 'idx_manager_id')
      })
    }
  }

  async down() {
    // Remove from employees
    this.schema.alterTable('employees', (table) => {
      table.dropIndex('idx_manager_id')
      table.dropForeign('manager_id')
      table.dropColumn('manager_id')
      table.dropColumn('phone_verified')
      table.dropColumn('phone_auth_enabled')
      table.dropColumn('login_type')
      table.dropColumn('is_international')
    })

    // Remove from organizations
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('default_geofence_id')
      table.dropColumn('allowed_login_methods')
      table.dropColumn('default_language')
      table.dropColumn('org_type')
      table.dropColumn('default_geofence_id')
      table.dropColumn('require_geofence_for_all')
      table.dropColumn('geofence_enabled')
      table.dropColumn('slug')
    })
  }
}

