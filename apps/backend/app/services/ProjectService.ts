import Project from '#models/project'
import Task from '#models/task'

export default class ProjectService {
    /**
     * List projects
     */
    async list(orgId: number) {
        return await Project.query().where('org_id', orgId).whereNull('deleted_at')
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
        return await Task.query()
            .where('project_id', projectId)
            .where('org_id', orgId)
            .preload('assignee')
    }

    /**
     * Add task to project
     */
    async addTask(projectId: number, orgId: number, data: any) {
        return await Task.create({ ...data, projectId, orgId })
    }
}
