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
            embedding: vine.string().optional(), // JSON string of embedding array
            embeddings: vine.array(vine.string()).optional(), // JSON strings of embedding arrays
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
        const incomingEmbeddings = data.embeddings?.length
            ? data.embeddings
            : data.embedding
                ? [data.embedding]
                : []

        if (!incomingEmbeddings.length) {
            return response.badRequest({ message: 'At least one face embedding is required' })
        }

        // Check if employee belongs to same org
        const targetEmployee = await Employee.query()
            .where('id', data.employeeId)
            .where('org_id', employee.orgId)
            .first()

        if (!targetEmployee) {
            return response.notFound({ message: 'Employee not found in your organization' })
        }

        // Keep up to 5 active samples per employee for stronger matching
        const activeEmbeddings = await FaceEmbedding.query()
            .where('employee_id', data.employeeId)
            .where('org_id', employee.orgId)
            .where('is_active', true)
            .orderBy('created_at', 'desc')

        const maxTemplates = 5
        const slotsLeft = Math.max(0, maxTemplates - incomingEmbeddings.length)
        const embeddingsToDeactivate = activeEmbeddings.slice(slotsLeft)
        if (embeddingsToDeactivate.length) {
            await FaceEmbedding.query()
                .whereIn(
                    'id',
                    embeddingsToDeactivate.map((embedding) => embedding.id),
                )
                .update({ isActive: false })
        }

        const createdEmbeddings = []
        for (const embedding of incomingEmbeddings) {
            createdEmbeddings.push(
                await FaceEmbedding.create({
                    employeeId: data.employeeId,
                    orgId: employee.orgId,
                    embedding,
                    imageUrl: data.imageUrl || null,
                    isActive: true,
                }),
            )
        }

        return response.created({
            status: 'success',
            message: `Face registered successfully (${createdEmbeddings.length} sample${createdEmbeddings.length === 1 ? '' : 's'})`,
            data: createdEmbeddings,
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
            const embeddings = await FaceEmbedding.query()
                .where('employee_id', data.employeeId)
                .where('org_id', employee.orgId)
                .where('is_active', true)
                .orderBy('created_at', 'desc')

            if (!embeddings.length) {
                return response.notFound({ message: 'No active face registration found for this employee' })
            }

            const match = this.findBestMatch(JSON.parse(data.embedding), embeddings)

            return response.ok({
                status: 'success',
                matched: match.similarity > 0.7, // Threshold
                similarity: match.similarity,
                employeeId: data.employeeId,
                sampleCount: embeddings.length,
            })
        }

        // Search all active employees in org
        const embeddings = await FaceEmbedding.query()
            .where('org_id', employee.orgId)
            .where('is_active', true)
            .orderBy('created_at', 'desc')

        const bestMatch = this.findBestMatchAcrossEmployees(JSON.parse(data.embedding), embeddings)

        if (bestMatch && bestMatch.similarity > 0.7) {
            return response.ok({
                status: 'success',
                matched: true,
                similarity: bestMatch.similarity,
                employeeId: bestMatch.employeeId,
                sampleCount: bestMatch.sampleCount,
            })
        }

        return response.ok({
            status: 'success',
            matched: false,
            similarity: bestMatch?.similarity || 0,
            sampleCount: bestMatch?.sampleCount || 0,
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
            sampleCount: embedding
                ? (await FaceEmbedding.query()
                    .where('employee_id', targetEmployeeId)
                    .where('org_id', employee.orgId)
                    .where('is_active', true)).length
                : 0,
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

    private findBestMatch(
        inputEmbedding: number[],
        embeddings: FaceEmbedding[],
    ): { similarity: number; embedding: FaceEmbedding | null } {
        let best: FaceEmbedding | null = null
        let bestSimilarity = 0

        for (const embedding of embeddings) {
            const similarity = this.compareEmbeddings(inputEmbedding, embedding.getEmbeddingArray())
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity
                best = embedding
            }
        }

        return { similarity: bestSimilarity, embedding: best }
    }

    private findBestMatchAcrossEmployees(
        inputEmbedding: number[],
        embeddings: FaceEmbedding[],
    ): { employeeId: number; similarity: number; sampleCount: number } | null {
        let bestEmployeeId = 0
        let bestSimilarity = 0
        let bestSampleCount = 0

        const grouped = new Map<number, FaceEmbedding[]>()
        for (const embedding of embeddings) {
            const list = grouped.get(embedding.employeeId) || []
            list.push(embedding)
            grouped.set(embedding.employeeId, list)
        }

        for (const [employeeId, list] of grouped.entries()) {
            const match = this.findBestMatch(inputEmbedding, list)
            if (match.similarity > bestSimilarity) {
                bestSimilarity = match.similarity
                bestEmployeeId = employeeId
                bestSampleCount = list.length
            }
        }

        if (!bestEmployeeId) return null

        return {
            employeeId: bestEmployeeId,
            similarity: bestSimilarity,
            sampleCount: bestSampleCount,
        }
    }
}

