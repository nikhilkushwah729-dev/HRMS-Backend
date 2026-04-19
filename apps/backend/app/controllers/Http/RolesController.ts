import { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import Permission from '#models/permission'
import AuthorizationService from '#services/AuthorizationService'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class RolesController {
    constructor(protected authorizationService: AuthorizationService) { }

    private isPlatformSuperAdminRole(roleName: string | null | undefined, orgId: number | null | undefined): boolean {
        return String(roleName || '').trim().toLowerCase() === 'super admin' && orgId == null
    }

    private async isPlatformSuperAdmin(employee: any): Promise<boolean> {
        await employee.load('role')
        return this.isPlatformSuperAdminRole(employee.role?.roleName, employee.role?.orgId)
    }

    private async hasTable(tableName: string): Promise<boolean> {
        const result = await db.rawQuery(
            'select 1 as present from information_schema.tables where table_schema = database() and table_name = ? limit 1',
            [tableName]
        )
        return Array.isArray(result.rows) && result.rows.length > 0
    }

    static roleValidator = vine.compile(
        vine.object({
            roleName: vine.string().maxLength(100),
            description: vine.string().trim().maxLength(255).optional(),
            parentRoleId: vine.number().nullable().optional(),
            permissions: vine.array(vine.number()).optional(),
        })
    )

    /**
     * List all roles for the organization
     */
    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const isPlatformSuperAdmin = await this.isPlatformSuperAdmin(employee)
        await this.authorizationService.ensureCatalogSeeded()
        const hasRolePermissionsTable = await this.hasTable('role_permissions')
        let rolesQuery = Role.query()
            .where((q) => {
                q.where('org_id', employee.orgId)
                if (isPlatformSuperAdmin) {
                    q.orWhereNull('org_id')
                } else {
                    q.orWhere((globalQuery) => {
                        globalQuery.whereNull('org_id').whereNot('role_name', 'Super Admin')
                    })
                }
            })

        if (hasRolePermissionsTable) {
            rolesQuery = rolesQuery.preload('permissions')
        }

        const roles = await rolesQuery

        return response.ok({
            status: 'success',
            data: roles
        })
    }
    async show({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const isPlatformSuperAdmin = await this.isPlatformSuperAdmin(employee)
        try {
            const hasRolePermissionsTable = await this.hasTable('role_permissions')
            let roleQuery = Role.query()
                .where('id', params.id)
                .where((q) => {
                    q.where('org_id', employee.orgId)
                    if (isPlatformSuperAdmin) {
                        q.orWhereNull('org_id')
                    } else {
                        q.orWhere((globalQuery) => {
                            globalQuery.whereNull('org_id').whereNot('role_name', 'Super Admin')
                        })
                    }
                })

            if (hasRolePermissionsTable) {
                roleQuery = roleQuery.preload('permissions')
            }

            const role = await roleQuery.first()

            if (!role) {
                return response.notFound({ status: 'error', message: 'Role not found' })
            }

            return response.ok({
                status: 'success',
                data: role,
            })
        } catch (error) {
            console.error(`Failed to fetch role ${params.id}:`, error)
            return response.ok({
                status: 'success',
                data: null,
            })
        }
    }

    /**
     * Create a custom role
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { roleName, description, parentRoleId, permissions } = await request.validateUsing(RolesController.roleValidator)

        const role = await Role.create({
            roleName,
            description,
            parentRoleId: parentRoleId ?? null,
            orgId: employee.orgId,
            isSystem: false,
            isActive: true,
        })

        if (permissions && permissions.length > 0) {
            await role.related('permissions').attach(permissions)
        }

        await role.load('permissions')

        return response.created({
            status: 'success',
            message: 'Role created',
            data: role
        })
    }

    /**
     * Update a role's permissions
     */
    async update({ auth, params, request, response }: HttpContext) {
        const employee = auth.user!
        const { roleName, description, parentRoleId, permissions } = await request.validateUsing(RolesController.roleValidator)

        const role = await Role.query()
            .where('id', params.id)
            .where('org_id', employee.orgId)
            .first()

        if (!role) {
            return response.notFound({ status: 'error', message: 'Role not found' })
        }

        role.roleName = roleName
        role.description = description ?? null
        role.parentRoleId = parentRoleId ?? null
        await role.save()

        if (permissions) {
            await role.related('permissions').sync(permissions)
        }

        await role.load('permissions')

        return response.ok({
            status: 'success',
            message: 'Role updated',
            data: role
        })
    }

    /**
     * List all available permissions
     */
    async getPermissions({ response }: HttpContext) {
        try {
            await this.authorizationService.ensureCatalogSeeded()
            const hasPermissionsTable = await this.hasTable('permissions')
            const permissions = hasPermissionsTable ? await Permission.all() : []

            return response.ok({
                status: 'success',
                data: permissions
            })
        } catch (error) {
            console.error('Failed to fetch permissions catalog:', error)
            return response.ok({
                status: 'success',
                data: []
            })
        }
    }

    async destroy({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const role = await Role.query()
            .where('id', params.id)
            .where('org_id', employee.orgId)
            .where('is_system', false)
            .first()

        if (!role) {
            return response.notFound({ status: 'error', message: 'Role not found' })
        }

        await role.delete()

        return response.ok({
            status: 'success',
            message: 'Role deleted',
        })
    }
}
