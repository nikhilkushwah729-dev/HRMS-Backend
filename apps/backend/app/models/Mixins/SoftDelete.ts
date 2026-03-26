import { DateTime } from 'luxon'
import { column } from '@adonisjs/lucid/orm'
import { LucidModel } from '@adonisjs/lucid/types/model'

export function withSoftDelete<T extends LucidModel>(Base: T) {
    abstract class SoftDeleteModel extends (Base as any) {
        @column.dateTime({ serializeAs: null })
        declare deletedAt: DateTime | null

        @column({ serializeAs: null })
        declare deletedBy: number | null

        static boot() {
            const self = this as any
            if (self.booted) {
                return
            }
            super.boot()

            if (self.before) {
                self.before('find', (query: any) => {
                    query.whereNull('deleted_at')
                })

                self.before('fetch', (query: any) => {
                    query.whereNull('deleted_at')
                })
            }
        }

        async softDelete(deletedBy?: number) {
            const self = this as any
            self.deletedAt = DateTime.now()
            if (deletedBy) {
                self.deletedBy = deletedBy
            }
            await self.save()
        }

        async restore() {
            const self = this as any
            self.deletedAt = null
            self.deletedBy = null
            await self.save()
        }
    }

    return SoftDeleteModel as T & {
        new(...args: any[]): InstanceType<T> & {
            deletedAt: DateTime | null
            deletedBy: number | null
            softDelete(deletedBy?: number): Promise<void>
            restore(): Promise<void>
        }
    }
}
