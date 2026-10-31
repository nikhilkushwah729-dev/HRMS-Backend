import { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import FaceEmbedding from '#models/face_embedding'
import Employee from '#models/employee'
import AttendanceService from '#services/AttendanceService'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'

@inject()
export default class FaceRecognitionController {
    constructor(protected attendanceService: AttendanceService) { }

    private static isTableEnsured = false

    public static async ensureTable() {
        if (FaceRecognitionController.isTableEnsured) return

        try {
            const hasTable = await db.connection().schema.hasTable('face_embeddings')
            if (!hasTable) {
                try {
                    await db.connection().schema.createTable('face_embeddings', (table) => {
                        table.increments('id').unsigned().primary()
                        table.integer('employee_id').unsigned().notNullable()
                        table.integer('org_id').unsigned().notNullable()
                        table.text('embedding', 'longtext').notNullable()
                        table.string('image_url', 500).nullable()
                        table.boolean('is_active').notNullable().defaultTo(true)
                        table.timestamps(true, true)

                        table.index(['employee_id'], 'idx_face_embeddings_employee_id')
                        table.index(['org_id'], 'idx_face_embeddings_org_id')
                        table.index(['is_active'], 'idx_face_embeddings_active')
                    })
                } catch {
                    await db.rawQuery(`
                        CREATE TABLE IF NOT EXISTS face_embeddings (
                            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                            employee_id INT UNSIGNED NOT NULL,
                            org_id INT UNSIGNED NOT NULL,
                            embedding LONGTEXT NOT NULL,
                            image_url VARCHAR(500) NULL,
                            is_active BOOLEAN NOT NULL DEFAULT TRUE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            INDEX idx_face_embeddings_employee_id (employee_id),
                            INDEX idx_face_embeddings_org_id (org_id),
                            INDEX idx_face_embeddings_active (is_active)
                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                    `)
                }
            }
            FaceRecognitionController.isTableEnsured = true
        } catch (error) {
            console.error('[FaceRecognitionController] ensureTable warning:', error)
        }
    }

    private isPrivilegedRole(roleId: number | null | undefined): boolean {
        return !!roleId && [1, 2, 3].includes(roleId)
    }

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
            employeeId: vine.number().optional(),
            action: vine.enum(['check_in', 'check_out']).optional(),
        })
    )

    /**
     * Register face embedding for an employee
     */
    async register({ auth, request, response }: HttpContext) {
        await FaceRecognitionController.ensureTable()
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

        // Authorization: Employee can register own face; only HR/Admin (roleId 1, 2, 3) can register for others
        const isSelf = employee.id === data.employeeId
        const isPrivileged = this.isPrivilegedRole(employee.roleId)
        if (!isSelf && !isPrivileged) {
            return response.forbidden({ message: 'You do not have permission to register face data for another employee' })
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
     * Parse embedding from payload whether it is raw number array, JSON string, or serialized object
     */
    private parseEmbeddingPayload(input: any): number[] | null {
        if (!input) return null
        let arr: number[] | null = null
        if (Array.isArray(input)) {
            arr = input.map(Number)
        } else if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input)
                arr = Array.isArray(parsed) ? parsed.map(Number) : null
            } catch {
                return null
            }
        }
        if (!arr || arr.length < 64) {
            return null
        }
        if (arr.some((val) => isNaN(val) || !isFinite(val))) {
            return null
        }
        return arr
    }

    /**
     * Verify face against stored embeddings and optionally record attendance
     */
    async verify({ auth, request, response }: HttpContext) {
        await FaceRecognitionController.ensureTable()
        const employee = auth.user!
        const rawEmbedding = request.input('embedding')
        const embeddingArray = this.parseEmbeddingPayload(rawEmbedding)

        if (!embeddingArray || embeddingArray.length === 0) {
            return response.badRequest({ message: 'Valid face embedding array (minimum 64 dimensions) is required' })
        }

        const data = await request.validateUsing(FaceRecognitionController.verifyFaceValidator)
        const action = data.action

        let matched = false
        let similarity = 0
        let matchedEmployeeId: number | null = null
        let sampleCount = 0

        // If verifying for specific employee
        if (data.employeeId) {
            const isSelf = employee.id === data.employeeId
            const isPrivileged = this.isPrivilegedRole(employee.roleId)
            if (!isSelf && !isPrivileged) {
                return response.forbidden({ message: 'You cannot perform face verification punches on behalf of other employees' })
            }

            const embeddings = await FaceEmbedding.query()
                .where('employee_id', data.employeeId)
                .where('org_id', employee.orgId)
                .where('is_active', true)
                .orderBy('created_at', 'desc')

            if (!embeddings.length) {
                return response.notFound({ message: 'No active face registration found for this employee' })
            }

            const match = this.findBestMatch(embeddingArray, embeddings)
            similarity = match.similarity
            matched = similarity > 0.7
            matchedEmployeeId = data.employeeId
            sampleCount = embeddings.length
        } else {
            // Search all active employees in org
            const embeddings = await FaceEmbedding.query()
                .where('org_id', employee.orgId)
                .where('is_active', true)
                .orderBy('created_at', 'desc')

            const bestMatch = this.findBestMatchAcrossEmployees(embeddingArray, embeddings)
            if (bestMatch && bestMatch.similarity > 0.7) {
                matched = true
                similarity = bestMatch.similarity
                matchedEmployeeId = bestMatch.employeeId
                sampleCount = bestMatch.sampleCount
            } else {
                similarity = bestMatch?.similarity || 0
                sampleCount = bestMatch?.sampleCount || 0
            }
        }

        if (!matched || !matchedEmployeeId) {
            return response.ok({
                status: 'success',
                success: false,
                matched: false,
                message: 'Face did not match any registered employee',
                similarity,
                sampleCount,
            })
        }

        // Fetch employee details
        const targetEmployee = await Employee.find(matchedEmployeeId)
        const employeeName = targetEmployee?.firstName || 'Employee'

        // Record attendance if action was specified
        let attendanceRecord = null
        if (action) {
            try {
                if (action === 'check_in') {
                    attendanceRecord = await this.attendanceService.checkIn(matchedEmployeeId, employee.orgId, {
                        source: 'face'
                    })
                } else if (action === 'check_out') {
                    attendanceRecord = await this.attendanceService.checkOut(matchedEmployeeId, {
                        source: 'face'
                    })
                }
            } catch (error: any) {
                return response.badRequest({
                    status: 'error',
                    success: false,
                    matched: true,
                    similarity,
                    employeeId: matchedEmployeeId,
                    message: error?.message || 'Attendance action failed',
                })
            }
        }

        return response.ok({
            status: 'success',
            success: true,
            matched: true,
            similarity,
            employeeId: matchedEmployeeId,
            sampleCount,
            employee: targetEmployee ? {
                id: targetEmployee.id,
                name: `${targetEmployee.firstName} ${targetEmployee.lastName || ''}`.trim(),
                email: targetEmployee.email,
            } : undefined,
            attendance: attendanceRecord ? {
                date: DateTime.now().toISODate()!,
                action: action,
                matchScore: `${Math.round(similarity * 100)}%`,
            } : undefined,
            tts: {
                name: employeeName,
                message: action === 'check_in'
                    ? `Welcome ${employeeName}, check-in recorded.`
                    : action === 'check_out'
                        ? `Goodbye ${employeeName}, check-out recorded.`
                        : `Face recognized as ${employeeName}.`,
            }
        })
    }

    /**
     * Get employee's face registration status
     */
    async status({ auth, params, response }: HttpContext) {
        try {
            await FaceRecognitionController.ensureTable()
            const employee = auth.user!
            const targetEmployeeId = Number(params.id)
            const isSelf = employee.id === targetEmployeeId
            const isPrivileged = this.isPrivilegedRole(employee.roleId)
            if (!isSelf && !isPrivileged) {
                return response.forbidden({ message: 'You do not have permission to view face status for this employee' })
            }

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
        } catch (error: any) {
            console.error('[FaceRecognitionController] status check error:', error?.message || error)
            return response.ok({
                status: 'success',
                registered: false,
                sampleCount: 0,
                data: null,
            })
        }
    }

    /**
     * Delete face registration
     */
    async delete({ auth, params, response }: HttpContext) {
        await FaceRecognitionController.ensureTable()
        const employee = auth.user!
        const targetEmployeeId = Number(params.id)
        const isSelf = employee.id === targetEmployeeId
        const isPrivileged = this.isPrivilegedRole(employee.roleId)
        if (!isSelf && !isPrivileged) {
            return response.forbidden({ message: 'You do not have permission to delete face registration for this employee' })
        }

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
