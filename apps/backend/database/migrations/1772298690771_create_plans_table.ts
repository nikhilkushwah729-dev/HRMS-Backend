import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned().primary()
      table.string('name', 100).notNullable()
      table.decimal('price', 10, 2).notNullable().defaultTo(0.00)
      table.integer('user_limit').notNullable().defaultTo(10)
      table.integer('duration_days').notNullable().defaultTo(30)
      table.json('features').nullable()
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('created_at').defaultTo(this.now())
      table.timestamp('updated_at').defaultTo(this.now())

      // [S14] CHECK constraints will be handled via SQL raw if needed,
      // but standard Lucid/Knex doesn't support them easily across all DBs.
      // We'll add them via raw SQL in the migration.
    })

    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_plan_price CHECK (price >= 0)`)
    this.schema.raw(`ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_plan_users CHECK (user_limit > 0)`)
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT chk_plan_duration CHECK (duration_days > 0)`
    )
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}