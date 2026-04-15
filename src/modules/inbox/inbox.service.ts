import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';

export class InboxService {
  constructor(private prisma: PrismaClient) {}

  async createPublicMessage(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    portfolioUsername: string;
  }) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: data.portfolioUsername },
      select: { userId: true },
    });

    if (!profile) {
      throw new AppError('Portfolio user not found', 404);
    }

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId: profile.userId },
      select: { id: true },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    return this.prisma.inboxMessage.create({
      data: {
        portfolioId: portfolio.id,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      },
    });
  }

  async getAllMessages(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) return { messages: [] };

    const messages = await this.prisma.inboxMessage.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { createdAt: 'desc' },
    });
    return { messages };
  }

  async getStats(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) return { total: 0, unread: 0, starred: 0 };

    const [total, unread, starred] = await Promise.all([
      this.prisma.inboxMessage.count({ where: { portfolioId: portfolio.id } }),
      this.prisma.inboxMessage.count({ where: { portfolioId: portfolio.id, isRead: false } }),
      this.prisma.inboxMessage.count({ where: { portfolioId: portfolio.id, isStarred: true } }),
    ]);

    return { total, unread, starred };
  }

  async updateMessageStatus(id: string, userId: string, data: { isRead?: boolean; isStarred?: boolean }) {
    await this._verifyOwnership(id, userId);
    return this.prisma.inboxMessage.update({
      where: { id },
      data,
    });
  }

  async deleteMessage(id: string, userId: string) {
    await this._verifyOwnership(id, userId);
    await this.prisma.inboxMessage.delete({ where: { id } });
  }

  async deleteAllMessages(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) throw new AppError('Portfolio not found', 404);

    await this.prisma.inboxMessage.deleteMany({
      where: { portfolioId: portfolio.id },
    });
  }

  private async _verifyOwnership(messageId: string, userId: string) {
    const message = await this.prisma.inboxMessage.findUnique({
      where: { id: messageId },
      include: { portfolio: true },
    });
    if (!message || message.portfolio.userId !== userId) {
      throw new AppError('Message not found', 404);
    }
    return message;
  }
}
