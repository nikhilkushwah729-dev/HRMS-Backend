import Announcement from '#models/announcement'
import { DateTime } from 'luxon'

export default class AnnouncementService {
    async list(orgId: number) {
        return await Announcement.query()
            .where('org_id', orgId)
            .whereNull('deleted_at')
            .where((q) => {
                q.where('expires_at', '>', DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')!)
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

    async show(orgId: number, id: number) {
        return await Announcement.query()
            .where('org_id', orgId)
            .where('id', id)
            .whereNull('deleted_at')
            .first()
    }

    async update(orgId: number, id: number, data: any) {
        const announcement = await Announcement.query()
            .where('org_id', orgId)
            .where('id', id)
            .firstOrFail()

        announcement.merge(data)
        await announcement.save()
        return announcement
    }
}
