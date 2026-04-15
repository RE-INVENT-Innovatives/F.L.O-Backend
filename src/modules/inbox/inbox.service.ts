import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';

export class InboxService {
  constructor(private prisma: PrismaClient) {}

  async createContactMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    portfolioUsername: string;
  }) {
    // Find portfolio by username (githubLogin)
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: data.portfolioUsername },
      include: { user: { include: { portfolio: true } } }
    });

    if (!profile?.user?.portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    return this.prisma.inboxMessage.create({
      data: {
        portfolioId: profile.user.portfolio.id,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      },
    });
  }

  async getAll(portfolioId: string) {
    return this.prisma.inboxMessage.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(portfolioId: string) {
    const [total, unread, starred] = await Promise.all([
      this.prisma.inboxMessage.count({ where: { portfolioId } }),
      this.prisma.inboxMessage.count({ where: { portfolioId, isRead: false } }),
      this.prisma.inboxMessage.count({ where: { portfolioId, isStarred: true } }),
    ]);

    return { total, unread, starred };
  }

  async markAsRead(id: string, portfolioId: string) {
    const existing = await this.prisma.inboxMessage.findFirst({
      where: { id, portfolioId },
    });

    if (!existing) {
      throw new AppError('Message not found', 404);
    }

    return this.prisma.inboxMessage.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAsUnread(id: string, portfolioId: string) {
    const existing = await this.prisma.inboxMessage.findFirst({
      where: { id, portfolioId },
    });

    if (!existing) {
      throw new AppError('Message not found', 404);
    }

    return this.prisma.inboxMessage.update({
      where: { id },
      data: { isRead: false },
    });
  }

  async toggleStar(id: string, portfolioId: string) {
    const existing = await this.prisma.inboxMessage.findFirst({
      where: { id, portfolioId },
    });

    if (!existing) {
      throw new AppError('Message not found', 404);
    }

    return this.prisma.inboxMessage.update({
      where: { id },
      data: { isStarred: !existing.isStarred },
    });
  }

  async delete(id: string, portfolioId: string) {
    const existing = await this.prisma.inboxMessage.findFirst({
      where: { id, portfolioId },
    });

    if (!existing) {
      throw new AppError('Message not found', 404);
    }

    await this.prisma.inboxMessage.delete({
      where: { id },
    });
  }

  async deleteAll(portfolioId: string) {
    await this.prisma.inboxMessage.deleteMany({
      where: { portfolioId },
    });
  }
}
