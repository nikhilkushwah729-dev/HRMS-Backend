import { HttpContext } from '@adonisjs/core/http'
import Notification from '#models/notification'
import { DateTime } from 'luxon'

export default class NotificationsController {
    /**
     * Get unread notifications for the logged-in employee
     */
    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const notifications = await Notification.query()
            .where('employee_id', employee.id)
            .where('org_id', employee.orgId)
            .orderBy('created_at', 'desc')
            .limit(20)

        return response.ok({
            status: 'success',
            data: notifications
        })
    }

    /**
     * Mark notification as read
     */
    async markAsRead({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const notification = await Notification.query()
            .where('id', params.id)
            .where('employee_id', employee.id)
            .first()

        if (!notification) {
            return response.notFound({ status: 'error', message: 'Notification not found' })
        }

        notification.isRead = true
        notification.readAt = DateTime.now()
        await notification.save()

        return response.ok({
            status: 'success',
            message: 'Notification marked as read'
        })
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead({ auth, response }: HttpContext) {
        const employee = auth.user!
        await Notification.query()
            .where('employee_id', employee.id)
            .where('is_read', false)
            .update({
                is_read: true,
                read_at: DateTime.now().toSQL()
            })

        return response.ok({
            status: 'success',
            message: 'All notifications marked as read'
        })
    }

    /**
     * Delete a notification
     */
    async destroy({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const notification = await Notification.query()
            .where('id', params.id)
            .where('employee_id', employee.id)
            .first()

        if (!notification) {
            return response.notFound({ status: 'error', message: 'Notification not found' })
        }

        await notification.delete()

        return response.ok({
            status: 'success',
            message: 'Notification deleted'
        })
    }
}
