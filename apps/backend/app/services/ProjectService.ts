import Project from '#models/project'
import Task from '#models/task'

export default class ProjectService {
    /**
     * List projects
     */
    async list(orgId: number) {
        try {
            return await Project.query().where((q) => {
                if (orgId) {
                    q.where('org_id', orgId).orWhereNull('org_id')
                }
            })
        } catch {
            return []
        }
    }

    /**
     * Create project
     */
    async create(orgId: number, data: any) {
        return await Project.create({ ...data, orgId })
    }

    /**
     * Get tasks for project
     */
    async getTasks(projectId: number, orgId: number) {
        try {
            return await Task.query()
                .where('project_id', projectId)
                .where((q) => {
                    if (orgId) {
                        q.where('org_id', orgId).orWhereNull('org_id')
                    }
                })
                .preload('assignee')
        } catch {
            return []
        }
    }

    /**
     * Add task to project
     */
    async addTask(projectId: number, orgId: number, data: any) {
        return await Task.create({ ...data, projectId, orgId })
    }
}
