import { FastifyReply, FastifyRequest } from 'fastify';
import { InboxService } from './inbox.service';

export class InboxController {
  constructor(private inboxService: InboxService) {}

  async createContactMessage(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as any;
    const result = await this.inboxService.createPublicMessage(data);
    return reply.status(201).send(result);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.inboxService.getAllMessages(userId);
    return reply.send(result);
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.inboxService.getStats(userId);
    return reply.send(result);
  }

  async markRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.inboxService.updateMessageStatus(id, userId, { isRead: true });
    return reply.send(result);
  }

  async markUnread(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.inboxService.updateMessageStatus(id, userId, { isRead: false });
    return reply.send(result);
  }

  async toggleStar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const message = await this.inboxService['_verifyOwnership'](id, userId);
    const result = await this.inboxService.updateMessageStatus(id, userId, { isStarred: !message.isStarred });
    return reply.send(result);
  }

  async deleteOne(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    await this.inboxService.deleteMessage(id, userId);
    return reply.status(204).send();
  }

  async deleteAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    await this.inboxService.deleteAllMessages(userId);
    return reply.status(204).send();
  }
}
