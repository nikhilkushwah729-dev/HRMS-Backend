import AuditLog from '#models/audit_log'
import { LucidModel } from '@adonisjs/lucid/types/model'

export function withAuditLog<T extends LucidModel>(Base: T) {
  abstract class AuditLogModel extends (Base as any) {
    static boot() {
      const self = this as any
      if (self.booted) {
        return
      }
      super.boot()

      if (self.after) {
        self.after('create', async (model: any) => {
          await AuditLog.create({
            orgId: model.orgId || null,
            employeeId: model.$extras.userId || null,
            action: 'CREATE',
            module: model.constructor.name,
            entityId: String(model.id),
            newValues: model.toJSON(),
            oldValues: null,
          })
        })

        self.after('update', async (model: any) => {
          await AuditLog.create({
            orgId: model.orgId || null,
            employeeId: model.$extras.userId || null,
            action: 'UPDATE',
            module: model.constructor.name,
            entityId: String(model.id),
            newValues: model.$dirty,
            oldValues: model.$original,
          })
        })

        self.after('delete', async (model: any) => {
          await AuditLog.create({
            orgId: model.orgId || null,
            employeeId: model.$extras.userId || null,
            action: 'DELETE',
            module: model.constructor.name,
            entityId: String(model.id),
            newValues: null,
            oldValues: model.toJSON(),
          })
        })
      }
    }
  }

  return AuditLogModel as T & {
    new(...args: any[]): InstanceType<T>
  }
}
