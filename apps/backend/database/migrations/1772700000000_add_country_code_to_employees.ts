import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'employees'

  public async up() {
    const hasPhoneVerified = await this.schema.hasColumn(this.tableName, 'phone_verified')
    const hasPhoneAuthEnabled = await this.schema.hasColumn(this.tableName, 'phone_auth_enabled')
    const hasLoginType = await this.schema.hasColumn(this.tableName, 'login_type')
    const hasIsInternational = await this.schema.hasColumn(this.tableName, 'is_international')
    const hasCountryCode = await this.schema.hasColumn(this.tableName, 'country_code')
    const hasCountryName = await this.schema.hasColumn(this.tableName, 'country_name')

    this.schema.alterTable(this.tableName, (table) => {
      if (!hasPhoneVerified) {
        table.boolean('phone_verified').notNullable().defaultTo(false)
      }
      if (!hasPhoneAuthEnabled) {
        table.boolean('phone_auth_enabled').notNullable().defaultTo(false)
      }
      if (!hasLoginType) {
        table.enum('login_type', ['email', 'google', 'microsoft', 'phone']).defaultTo('email')
      }
      if (!hasIsInternational) {
        table.boolean('is_international').notNullable().defaultTo(false)
      }
      if (!hasCountryCode) {
        table.string('country_code', 5).nullable()
      }
      if (!hasCountryName) {
        table.string('country_name', 100).nullable()
      }
    })
  }

  public async down() {
    const hasCountryCode = await this.schema.hasColumn(this.tableName, 'country_code')
    const hasCountryName = await this.schema.hasColumn(this.tableName, 'country_name')

    this.schema.alterTable(this.tableName, (table) => {
      if (hasCountryCode) {
        table.dropColumn('country_code')
      }
      if (hasCountryName) {
        table.dropColumn('country_name')
      }
    })
  }
}
