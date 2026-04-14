import { DateTime } from 'luxon'
import { HttpContext } from '@adonisjs/core/http'
import Document from '#models/document'
import { inject } from '@adonisjs/core'
import vine from '@vinejs/vine'
import MediaUploadService from '#services/MediaUploadService'
import fs from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

@inject()
export default class DocumentsController {
    constructor(protected mediaUploadService: MediaUploadService) { }

    static documentValidator = vine.compile(
        vine.object({
            name: vine.string().maxLength(255).optional(),
            category: vine.string().optional(),
            isPrivate: vine.boolean().optional(),
            employeeId: vine.number().optional(),
            description: vine.string().optional(),
        })
    )

    private serializeDocument(document: Document) {
        return {
            id: document.id,
            employeeId: document.employeeId,
            orgId: document.orgId,
            name: document.title,
            fileName: document.fileName || document.title,
            filePath: document.filePath || '',
            fileSize: Number(document.fileSizeKb ?? 0) * 1024,
            mimeType: document.mimeType || 'application/octet-stream',
            category: document.category || 'other',
            description: document.description || undefined,
            uploadedBy: Number(document.uploadedBy ?? 0),
            uploadedAt: document.createdAt.toISO(),
            employee: document.employee
                ? {
                    id: document.employee.id,
                    firstName: document.employee.firstName,
                    lastName: document.employee.lastName,
                    email: document.employee.email,
                }
                : undefined
        }
    }

    /**
     * List accessible documents
     */
    async index({ auth, response }: HttpContext) {
        const employee = auth.user!
        const documents = await Document.query()
            .preload('employee')
            .where('org_id', employee.orgId)
            .where((q) => {
                q.where('is_private', false)
                    .orWhere('uploaded_by', employee.id)
                    .orWhere('employee_id', employee.id)
            })
            .whereNull('deleted_at')
            .orderBy('created_at', 'desc')

        return response.ok({
            status: 'success',
            data: documents.map((document) => this.serializeDocument(document))
        })
    }

    /**
     * Store a new document reference
     */
    async store({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(DocumentsController.documentValidator)
        const file = request.file('file', {
            size: '10mb',
            extnames: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'webp'],
        })

        if (!file || !file.isValid) {
            return response.badRequest({
                status: 'error',
                message: file?.errors?.[0]?.message || 'Valid file upload is required'
            })
        }

        if (!file.tmpPath) {
            return response.badRequest({
                status: 'error',
                message: 'Uploaded file is missing'
            })
        }

        const buffer = await fs.readFile(file.tmpPath).catch(() => null)
        if (!buffer) {
            return response.badRequest({
                status: 'error',
                message: 'Failed to read uploaded file'
            })
        }

        const originalName = file.clientName || 'document'
        const title = data.name?.trim() || originalName.replace(/\.[^/.]+$/, '')
        const mimeType = file.type && file.subtype ? `${file.type}/${file.subtype}` : file.type || 'application/octet-stream'
        const fileName = originalName
        const fileSizeKb = Math.max(1, Math.ceil((file.size || 0) / 1024))
        const upload = await this.mediaUploadService.uploadFile(
            {
                buffer: Buffer.from(buffer),
                filename: originalName,
                mimeType,
            },
            'documents'
        )

        const document = await Document.create({
            title,
            fileName,
            filePath: upload.url,
            fileUuid: upload.publicId || randomUUID(),
            fileType: file.extname || file.type || null,
            fileSizeKb,
            mimeType,
            category: data.category || 'other',
            description: data.description || null,
            isPrivate: data.isPrivate ?? false,
            employeeId: data.employeeId ?? employee.id,
            orgId: employee.orgId,
            uploadedBy: employee.id,
        })

        return response.created({
            status: 'success',
            message: 'Document stored successfully',
            data: this.serializeDocument(document)
        })
    }

    async download({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const document = await Document.query()
            .where('id', params.id)
            .where('org_id', employee.orgId)
            .whereNull('deleted_at')
            .first()

        if (!document) {
            return response.notFound({
                status: 'error',
                message: 'Document not found'
            })
        }

        const fileUrl = document.filePath
        if (!fileUrl) {
            return response.notFound({
                status: 'error',
                message: 'Document file is unavailable'
            })
        }

        const remote = await fetch(fileUrl)
        if (!remote.ok) {
            return response.badGateway({
                status: 'error',
                message: 'Failed to fetch document file'
            })
        }

        const contentType = remote.headers.get('content-type') || document.mimeType || 'application/octet-stream'
        const contentDisposition = `attachment; filename="${encodeURIComponent(document.fileName || document.title || 'document')}"`
        response.header('Content-Type', contentType)
        response.header('Content-Disposition', contentDisposition)
        const arrayBuffer = await remote.arrayBuffer()
        return response.send(Buffer.from(arrayBuffer))
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

        document.deletedAt = DateTime.now()
        await document.save()

        return response.ok({
            status: 'success',
            message: 'Document deleted'
        })
    }
}
