import Announcement from '#models/announcement'
import { DateTime } from 'luxon'

export default class AnnouncementService {
    async list(orgId: number) {
        return await Announcement.query()
            .where('org_id', orgId)
            .where((q) => {
                q.where('expires_at', '>', DateTime.now().toSQL()!)
                    .orWhereNull('expires_at')
            })
            .orderBy('published_at', 'desc')
    }

    async create(orgId: number, creatorId: number, data: any) {
        return await Announcement.create({
            ...data,
            orgId,
            createdBy: creatorId,
            publishedAt: DateTime.now()
        })
    }
}
