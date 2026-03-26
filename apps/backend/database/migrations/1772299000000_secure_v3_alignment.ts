import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
    async up() {
        // 1. Add manager_id to employees
        this.schema.alterTable('employees', (table) => {
            table.integer('manager_id').unsigned().nullable().references('id').inTable('employees').onDelete('SET NULL').after('role_id')
            table.index(['manager_id'], 'idx_manager_id')
        })

        // 2. Add missing columns to leaves
        this.schema.alterTable('leaves', (table) => {
            table.timestamp('deleted_at').nullable().after('rejection_note')
            table.timestamp('updated_at').nullable().after('created_at')
            table.index(['deleted_at'], 'idx_leaves_deleted_at')
        })

        // 3. Add missing columns to expenses
        this.schema.alterTable('expenses', (table) => {
            table.text('rejection_note').nullable().after('approved_at')
            table.timestamp('deleted_at').nullable().after('rejection_note')
            table.timestamp('updated_at').nullable().after('created_at')
            table.index(['deleted_at'], 'idx_expenses_deleted_at')
        })
    }

    async down() {
        this.schema.alterTable('employees', (table) => {
            table.dropColumn('manager_id')
        })
        this.schema.alterTable('leaves', (table) => {
            table.dropColumn('deleted_at')
            table.dropColumn('updated_at')
        })
        this.schema.alterTable('expenses', (table) => {
            table.dropColumn('rejection_note')
            table.dropColumn('deleted_at')
            table.dropColumn('updated_at')
        })
    }
}
