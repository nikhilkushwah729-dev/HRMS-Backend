import AuditLog from '#models/audit_log'
import { LucidModel } from '@adonisjs/lucid/types/model'
import { sanitizeAuditData, extractChangedFields } from '#services/AuditLogService'

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
          try {
            const rawJson = typeof model.toJSON === 'function' ? model.toJSON() : model
            const sanitized = sanitizeAuditData(rawJson)
            const userId = model.$extras?.userId || null
            await AuditLog.create({
              orgId: model.orgId || null,
              userId,
              employeeId: userId,
              action: 'CREATE',
              module: model.constructor.name.toUpperCase(),
              entityType: model.constructor.name,
              entityName: model.constructor.name,
              entityId: String(model.id),
              description: `Created ${model.constructor.name} #${model.id}`,
              newValues: sanitized,
              oldValues: null,
              status: 'success',
            }, { client: model.$options?.client })
          } catch (e) {
            // Silence audit log failures to prevent transaction deadlock
          }
        })

        self.after('update', async (model: any) => {
          try {
            const { oldDiff, newDiff } = extractChangedFields(model.$original || {}, model.$dirty || {})
            const userId = model.$extras?.userId || null
            await AuditLog.create({
              orgId: model.orgId || null,
              userId,
              employeeId: userId,
              action: 'UPDATE',
              module: model.constructor.name.toUpperCase(),
              entityType: model.constructor.name,
              entityName: model.constructor.name,
              entityId: String(model.id),
              description: `Updated ${model.constructor.name} #${model.id}`,
              newValues: newDiff,
              oldValues: oldDiff,
              status: 'success',
            }, { client: model.$options?.client })
          } catch (e) {
            // Silence audit log failures to prevent transaction deadlock
          }
        })

        self.after('delete', async (model: any) => {
          try {
            const rawJson = typeof model.toJSON === 'function' ? model.toJSON() : model
            const sanitized = sanitizeAuditData(rawJson)
            const userId = model.$extras?.userId || null
            await AuditLog.create({
              orgId: model.orgId || null,
              userId,
              employeeId: userId,
              action: 'DELETE',
              module: model.constructor.name.toUpperCase(),
              entityType: model.constructor.name,
              entityName: model.constructor.name,
              entityId: String(model.id),
              description: `Deleted ${model.constructor.name} #${model.id}`,
              newValues: null,
              oldValues: sanitized,
              status: 'success',
            }, { client: model.$options?.client })
          } catch (e) {
            // Silence audit log failures to prevent transaction deadlock
          }
        })
      }
    }
  }

  return AuditLogModel as T & {
    new(...args: any[]): InstanceType<T>
  }
}
