import { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import Permission from '#models/permission'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class RolesController {
    static roleValidator = vine.compile(
        vine.object({
            roleName: vine.string().maxLength(100),
            permissions: vine.array(vine.number()).optional(),
        })
    )

    /**
     * List all roles for the organization
     */
    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const roles = await Role.query()
            .where((q) => {
                q.where('org_id', employee.orgId)
                    .orWhereNull('org_id') // System roles
            })
            .preload('permissions')

        return response.ok({
            status: 'success',
            data: roles
        })
    }

    /**
     * Create a custom role
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const { roleName, permissions } = await request.validateUsing(RolesController.roleValidator)

        const role = await Role.create({
            roleName,
            orgId: employee.orgId,
            isSystem: false
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
        const { roleName, permissions } = await request.validateUsing(RolesController.roleValidator)

        const role = await Role.query()
            .where('id', params.id)
            .where('org_id', employee.orgId)
            .first()

        if (!role) {
            return response.notFound({ status: 'error', message: 'Role not found' })
        }

        role.roleName = roleName
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
        const permissions = await Permission.all()
        return response.ok({
            status: 'success',
            data: permissions
        })
    }
}
