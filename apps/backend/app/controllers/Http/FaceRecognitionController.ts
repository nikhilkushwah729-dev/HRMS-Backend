import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import FaceEmbedding from '#models/face_embedding'
import Employee from '#models/employee'
import { inject } from '@adonisjs/core'

@inject()
export default class FaceRecognitionController {
    static registerFaceValidator = vine.compile(
        vine.object({
            employeeId: vine.number(),
            embedding: vine.string(), // JSON string of embedding array
            imageUrl: vine.string().optional(),
        })
    )

    static verifyFaceValidator = vine.compile(
        vine.object({
            embedding: vine.string(), // JSON string of embedding array
            employeeId: vine.number().optional(),
        })
    )

    /**
     * Register face embedding for an employee
     */
    async register({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(FaceRecognitionController.registerFaceValidator)

        // Check if employee belongs to same org
        const targetEmployee = await Employee.query()
            .where('id', data.employeeId)
            .where('org_id', employee.orgId)
            .first()

        if (!targetEmployee) {
            return response.notFound({ message: 'Employee not found in your organization' })
        }

        // Deactivate any existing embeddings for this employee
        await FaceEmbedding.query()
            .where('employee_id', data.employeeId)
            .update({ isActive: false })

        // Create new embedding
        const faceEmbedding = await FaceEmbedding.create({
            employeeId: data.employeeId,
            orgId: employee.orgId,
            embedding: data.embedding,
            imageUrl: data.imageUrl || null,
            isActive: true,
        })

        return response.created({
            status: 'success',
            message: 'Face registered successfully',
            data: faceEmbedding,
        })
    }

    /**
     * Verify face against stored embeddings
     */
    async verify({ auth, request, response }: HttpContext) {
        const employee = auth.user!
        const data = await request.validateUsing(FaceRecognitionController.verifyFaceValidator)

        // If verifying for specific employee
        if (data.employeeId) {
            const embedding = await FaceEmbedding.query()
                .where('employee_id', data.employeeId)
                .where('org_id', employee.orgId)
                .where('is_active', true)
                .first()

            if (!embedding) {
                return response.notFound({ message: 'No active face registration found for this employee' })
            }

            // Simple comparison (in production, use proper face recognition library)
            const similarity = this.compareEmbeddings(
                JSON.parse(data.embedding),
                embedding.getEmbeddingArray()
            )

            return response.ok({
                status: 'success',
                matched: similarity > 0.7, // Threshold
                similarity: similarity,
                employeeId: data.employeeId,
            })
        }

        // Search all active employees in org
        const embeddings = await FaceEmbedding.query()
            .where('org_id', employee.orgId)
            .where('is_active', true)

        let bestMatch: { employeeId: number; similarity: number } | null = null

        for (const embedding of embeddings) {
            const similarity = this.compareEmbeddings(
                JSON.parse(data.embedding),
                embedding.getEmbeddingArray()
            )

            if (!bestMatch || similarity > bestMatch.similarity) {
                bestMatch = { employeeId: embedding.employeeId, similarity }
            }
        }

        if (bestMatch && bestMatch.similarity > 0.7) {
            return response.ok({
                status: 'success',
                matched: true,
                similarity: bestMatch.similarity,
                employeeId: bestMatch.employeeId,
            })
        }

        return response.ok({
            status: 'success',
            matched: false,
            similarity: bestMatch?.similarity || 0,
        })
    }

    /**
     * Get employee's face registration status
     */
    async status({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const targetEmployeeId = params.id

        const embedding = await FaceEmbedding.query()
            .where('employee_id', targetEmployeeId)
            .where('org_id', employee.orgId)
            .where('is_active', true)
            .first()

        return response.ok({
            status: 'success',
            registered: !!embedding,
            data: embedding ? { id: embedding.id, imageUrl: embedding.imageUrl, createdAt: embedding.createdAt } : null,
        })
    }

    /**
     * Delete face registration
     */
    async delete({ auth, params, response }: HttpContext) {
        const employee = auth.user!
        const targetEmployeeId = params.id

        await FaceEmbedding.query()
            .where('employee_id', targetEmployeeId)
            .where('org_id', employee.orgId)
            .delete()

        return response.ok({
            status: 'success',
            message: 'Face registration deleted',
        })
    }

    /**
     * Simple cosine similarity comparison
     */
    private compareEmbeddings(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length || embedding1.length === 0) {
            return 0
        }

        let dotProduct = 0
        let norm1 = 0
        let norm2 = 0

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i]
            norm1 += embedding1[i] * embedding1[i]
            norm2 += embedding2[i] * embedding2[i]
        }

        if (norm1 === 0 || norm2 === 0) {
            return 0
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
    }
}

