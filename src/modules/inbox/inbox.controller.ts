import { FastifyReply, FastifyRequest } from 'fastify';
import { InboxService } from './inbox.service';

export class InboxController {
  constructor(private inboxService: InboxService) {}

  async createContactMessage(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      name: string;
      email: string;
      subject: string;
      message: string;
      portfolioUsername: string;
    };

    const result = await this.inboxService.createContactMessage(body);
    return reply.status(201).send(result);
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const messages = await this.inboxService.getAll(portfolio.id);
    return reply.send({ messages });
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const stats = await this.inboxService.getStats(portfolio.id);
    return reply.send(stats);
  }

  async markAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const result = await this.inboxService.markAsRead(id, portfolio.id);
    return reply.send(result);
  }

  async markAsUnread(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const result = await this.inboxService.markAsUnread(id, portfolio.id);
    return reply.send(result);
  }

  async toggleStar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const result = await this.inboxService.toggleStar(id, portfolio.id);
    return reply.send(result);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    await this.inboxService.delete(id, portfolio.id);
    return reply.status(204).send();
  }

  async deleteAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    await this.inboxService.deleteAll(portfolio.id);
    return reply.status(204).send();
  }
}
