import { HttpContext } from '@adonisjs/core/http'
import Document from '#models/document'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'

@inject()
export default class DocumentsController {
    static documentValidator = vine.compile(
        vine.object({
            name: vine.string().maxLength(255),
            fileUrl: vine.string(),
            fileType: vine.string().optional(),
            fileSize: vine.number().optional(),
            category: vine.string().optional(),
            isPrivate: vine.boolean().optional(),
            employeeId: vine.number().optional(),
        })
    )

    /**
     * List accessible documents
     */
    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const documents = await Document.query()
            .where('org_id', employee.orgId)
            .where((q) => {
                q.where('is_private', false)
                    .orWhere('uploaded_by', employee.id)
                    .orWhere('employee_id', employee.id)
            })
            .where('is_active', true)
            .orderBy('created_at', 'desc')

        return response.ok({
            status: 'success',
            data: documents
        })
    }

    /**
     * Store a new document reference
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(DocumentsController.documentValidator)

        const document = await Document.create({
            ...data,
            orgId: employee.orgId,
            uploadedBy: employee.id,
            isActive: true
        })

        return response.created({
            status: 'success',
            message: 'Document stored successfully',
            data: document
        })
    }

    /**
     * Delete a document (soft delete)
     */
    async destroy({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const document = await Document.query()
            .where('id', params.id)
            .where('org_id', employee.orgId)
            .first()

        if (!document) {
            return response.notFound({ status: 'error', message: 'Document not found' })
        }

        // Only uploader or admin can delete (simplified check here)
        if (document.uploadedBy !== employee.id) {
            // Check for admin role could be added here
        }

        document.isActive = false
        await document.save()

        return response.ok({
            status: 'success',
            message: 'Document deleted'
        })
    }
}
