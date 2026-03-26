import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    protected tableName = 'countries'

    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id').unsigned().primary()
            table.string('name', 100).notNullable()
            table.string('code', 10).notNullable()
            table.string('flag', 10).notNullable()
            table.integer('phone_number_length').nullable()
            table.boolean('is_active').notNullable().defaultTo(true)

            table.timestamp('created_at').defaultTo(this.now())
            table.timestamp('updated_at').defaultTo(this.now())

            table.index(['flag'], 'idx_flag')
            table.index(['is_active'], 'idx_is_active')
        })
    }

    async down() {
        this.schema.dropTable(this.tableName)
    }
}
