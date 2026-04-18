import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import EmployeeInvitation from '#models/employee_invitation'
import Employee from '#models/employee'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import { inject } from '@adonisjs/core'
import { Exception } from '@adonisjs/core/exceptions'
import mail from '@adonisjs/mail/services/main'
import EmployeeInvitationMailer from '#mailers/employee_invitation_mailer'

@inject()
export default class EmployeeInvitationsController {
    static inviteValidator = vine.compile(
        vine.object({
            email: vine.string().email(),
            roleId: vine.number().optional(),
        })
    )

    static respondValidator = vine.compile(
        vine.object({
            action: vine.enum(['accept', 'reject'] as const),
        })
    )

    private async sendInvitationEmail(invitation: EmployeeInvitation) {
        await invitation.load('organization', (query) => query.select('id', 'company_name'))

        if (invitation.roleId) {
            await invitation.load('role')
        }

        if (invitation.invitedBy) {
            await invitation.load('inviter', (query) => query.select('id', 'first_name', 'last_name', 'email'))
        }

        await mail.send(new EmployeeInvitationMailer({
            email: invitation.email,
            organizationName: invitation.organization?.companyName || 'your organization',
            roleName: invitation.role?.roleName || 'Employee',
            inviterName: invitation.inviter ? `${invitation.inviter.firstName} ${invitation.inviter.lastName || ''}`.trim() : 'HR Team',
            invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/invitation/${invitation.token}`,
            expiresAt: invitation.expiresAt.toFormat('dd LLL yyyy, hh:mm a'),
        }))
    }

    private buildNameFromEmail(email: string) {
        const localPart = email.split('@')[0] || 'Employee'
        const parts = localPart
            .split(/[._-]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))

        return {
            firstName: parts[0] || 'Employee',
            lastName: parts.slice(1).join(' ') || null,
        }
    }

    private async ensureEmployeeForInvitation(invitation: EmployeeInvitation) {
        const existingEmployee = await Employee.query()
            .whereRaw('LOWER(email) = ?', [invitation.email.toLowerCase()])
            .whereNull('deleted_at')
            .first()

        if (existingEmployee) {
            if (existingEmployee.orgId !== invitation.orgId) {
                throw new Exception('This email is already linked to another employee account and cannot be invited again', { status: 409 })
            }

            if (invitation.roleId && !existingEmployee.roleId) {
                existingEmployee.roleId = invitation.roleId
                await existingEmployee.save()
            }
            return existingEmployee
        }

        const derivedName = this.buildNameFromEmail(invitation.email)

        try {
            const employee = await Employee.create({
                orgId: invitation.orgId,
                roleId: invitation.roleId || null,
                employeeCode: `EMP-${invitation.orgId}-${invitation.id}`,
                firstName: derivedName.firstName,
                lastName: derivedName.lastName,
                email: invitation.email,
                status: 'active',
                emailVerified: true,
                loginType: 'email',
                phoneVerified: false,
                phoneAuthEnabled: false,
                mustChangePassword: true,
                isLocked: false,
                isInternational: false,
                joinDate: DateTime.now(),
            })

            return employee
        } catch (error: any) {
            if (error?.code === 'ER_DUP_ENTRY') {
                throw new Exception('This email is already linked to another employee account and cannot be invited again', { status: 409 })
            }
            throw error
        }
    }

    async invite({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(EmployeeInvitationsController.inviteValidator)

        const normalizedEmail = data.email.trim().toLowerCase()

        const existingEmployee = await Employee.query()
            .whereRaw('LOWER(email) = ?', [normalizedEmail])
            .whereNull('deleted_at')
            .first()

        if (existingEmployee) {
            if (existingEmployee.orgId === employee.orgId) {
                return response.conflict({ message: 'An employee with this email already exists in your organization' })
            }

            return response.conflict({ message: 'This email is already linked to another employee account and cannot be invited again' })
        }

        const existingInvitation = await EmployeeInvitation.query()
            .where('email', normalizedEmail)
            .where('org_id', employee.orgId)
            .where('status', 'pending')
            .first()

        if (existingInvitation && existingInvitation.expiresAt > DateTime.now()) {
            return response.badRequest({ message: 'An invitation has already been sent to this email' })
        }

        const token = randomUUID()
        const expiresAt = DateTime.now().plus({ days: 7 })

        const invitation = await EmployeeInvitation.create({
            orgId: employee.orgId,
            email: normalizedEmail,
            token,
            roleId: data.roleId || undefined,
            status: 'pending',
            expiresAt,
            invitedBy: employee.id,
        })

        let emailDelivered = false
        let deliveryError: string | null = null

        try {
            await this.sendInvitationEmail(invitation)
            emailDelivered = true
        } catch (error: any) {
            deliveryError = error?.message || 'Unknown mail error'
            console.error('[Employee Invitation Mail Error]:', error)
        }

        return response.created({
            status: 'success',
            message: emailDelivered ? 'Invitation sent successfully' : 'Invitation created, but email delivery failed',
            data: {
                id: invitation.id,
                email: invitation.email,
                roleId: invitation.roleId,
                status: invitation.status,
                invitedAt: invitation.createdAt,
                expiresAt: invitation.expiresAt,
                emailDelivered,
                deliveryError,
                invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/invitation/${token}`,
                _dev_token: token,
            },
        })
    }

    async list({ auth, response }: HttpContext) {
        const employee = auth.user!

        const invitations = await EmployeeInvitation.query()
            .where('org_id', employee.orgId)
            .orderBy('created_at', 'desc')

        await Promise.all(
            invitations.map(async (inv) => {
                await inv.load('organization', (q) => q.select('id', 'company_name'))
                if (inv.roleId) {
                    await inv.load('role')
                }
                if (inv.invitedBy) {
                    await inv.load('inviter', (q) => q.select('id', 'first_name', 'last_name'))
                }
            })
        )

        return response.ok({
            status: 'success',
            data: invitations.map((inv) => ({
                id: inv.id,
                email: inv.email,
                roleId: inv.roleId,
                roleName: inv.role?.roleName || null,
                organizationName: inv.organization?.companyName || null,
                status: inv.status,
                invitedBy: inv.invitedBy,
                invitedByName: inv.inviter ? `${inv.inviter.firstName} ${inv.inviter.lastName || ''}`.trim() : 'Admin',
                invitedAt: inv.createdAt,
                expiresAt: inv.expiresAt,
                acceptedAt: inv.status === 'accepted' ? inv.updatedAt : null,
            })),
        })
    }

    async getByToken({ params, response }: HttpContext) {
        const { token } = params

        const invitation = await EmployeeInvitation.query()
            .where('token', token)
            .where('status', 'pending')
            .first()

        if (!invitation) {
            return response.notFound({ message: 'Invalid or expired invitation' })
        }

        if (invitation.expiresAt < DateTime.now()) {
            invitation.status = 'expired'
            await invitation.save()
            return response.badRequest({ message: 'Invitation has expired' })
        }

        await invitation.load('organization', (q) => q.select('id', 'company_name', 'logo'))
        if (invitation.roleId) {
            await invitation.load('role')
        }

        return response.ok({
            status: 'success',
            data: {
                id: invitation.id,
                email: invitation.email,
                roleId: invitation.roleId,
                roleName: invitation.role?.roleName || 'Employee',
                organization: invitation.organization,
                organizationName: invitation.organization?.companyName || 'Organization',
                status: invitation.status,
                invitedAt: invitation.createdAt,
                expiresAt: invitation.expiresAt,
            },
        })
    }

    async respond({ params, request, response }: HttpContext) {
        const { token } = params
        const { action } = await request.validateUsing(EmployeeInvitationsController.respondValidator)

        const invitation = await EmployeeInvitation.query()
            .where('token', token)
            .where('status', 'pending')
            .first()

        if (!invitation) {
            return response.notFound({ message: 'Invalid or expired invitation' })
        }

        if (invitation.expiresAt < DateTime.now()) {
            invitation.status = 'expired'
            await invitation.save()
            return response.badRequest({ message: 'Invitation has expired' })
        }

        if (action === 'accept') {
            try {
                const createdEmployee = await this.ensureEmployeeForInvitation(invitation)
                invitation.status = 'accepted'
                await invitation.save()

                return response.ok({
                    status: 'success',
                    message: 'Invitation accepted successfully.',
                    data: {
                        invitationId: invitation.id,
                        email: invitation.email,
                        orgId: invitation.orgId,
                        employeeId: createdEmployee.id,
                    },
                })
            } catch (error: any) {
                if (error?.status === 409) {
                    return response.conflict({
                        status: 'error',
                        message: error.message,
                    })
                }
                throw error
            }
        }

        invitation.status = 'revoked'
        await invitation.save()

        return response.ok({
            status: 'success',
            message: 'Invitation declined',
        })
    }

    async revoke({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const { id } = params

        const invitation = await EmployeeInvitation.query()
            .where('id', id)
            .where('org_id', employee.orgId)
            .where('status', 'pending')
            .first()

        if (!invitation) {
            return response.notFound({ message: 'Invitation not found or already processed' })
        }

        invitation.status = 'revoked'
        await invitation.save()

        return response.ok({
            status: 'success',
            message: 'Invitation revoked',
        })
    }

    async resend({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const { id } = params

        const invitation = await EmployeeInvitation.query()
            .where('id', id)
            .where('org_id', employee.orgId)
            .where('status', 'pending')
            .first()

        if (!invitation) {
            return response.notFound({ message: 'Invitation not found or already processed' })
        }

        const token = randomUUID()
        invitation.token = token
        invitation.expiresAt = DateTime.now().plus({ days: 7 })
        await invitation.save()

        let emailDelivered = false
        let deliveryError: string | null = null

        try {
            await this.sendInvitationEmail(invitation)
            emailDelivered = true
        } catch (error: any) {
            deliveryError = error?.message || 'Unknown mail error'
            console.error('[Employee Invitation Mail Error]:', error)
        }

        return response.ok({
            status: 'success',
            message: emailDelivered ? 'Invitation resent successfully' : 'Invitation updated, but email delivery failed',
            data: {
                id: invitation.id,
                email: invitation.email,
                roleId: invitation.roleId,
                expiresAt: invitation.expiresAt,
                emailDelivered,
                deliveryError,
                invitationUrl: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/invitation/${token}`,
                _dev_token: token,
            },
        })
    }
}
