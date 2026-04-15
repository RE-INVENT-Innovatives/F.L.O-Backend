import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';

export class BlogService {
  constructor(private prisma: PrismaClient) {}

  private _generateSlug(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  }

  private async _getUniqueSlug(portfolioId: string, baseSlug: string, currentId?: string) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.blogPost.findUnique({
        where: { portfolioId_slug: { portfolioId, slug } },
      });

      if (!existing || existing.id === currentId) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async getAll(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) throw new AppError('Portfolio not found', 404);

    const posts = await this.prisma.blogPost.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true, 
        coverImageUrl: true, tags: true, status: true,
        isPublic: true, readingTimeMinutes: true, publishedAt: true,
        createdAt: true, updatedAt: true
      }
    });

    return { posts };
  }

  async getOne(id: string, userId: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: { portfolio: true },
    });

    if (!post || post.portfolio.userId !== userId) {
      throw new AppError('Post not found', 404);
    }
    return post;
  }

  async create(userId: string, data: any) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) throw new AppError('Portfolio not found', 404);

    const baseSlug = this._generateSlug(data.title);
    const slug = await this._getUniqueSlug(portfolio.id, baseSlug);
    
    const wordCount = (data.content || '').split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    const isPublished = data.status === 'published';

    return this.prisma.blogPost.create({
      data: {
        portfolioId: portfolio.id,
        title: data.title,
        slug,
        excerpt: data.excerpt || '',
        content: data.content || '',
        tags: data.tags || [],
        status: data.status || 'draft',
        readingTimeMinutes,
        isPublic: isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const existing = await this.getOne(id, userId);

    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      const baseSlug = this._generateSlug(data.title);
      slug = await this._getUniqueSlug(existing.portfolioId, baseSlug, existing.id);
    }

    const content = data.content !== undefined ? data.content : existing.content;
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

    let isPublic = existing.isPublic;
    let publishedAt = existing.publishedAt;

    if (data.status) {
      isPublic = data.status === 'published';
      if (data.status === 'published' && existing.status !== 'published') {
        publishedAt = new Date();
      } else if (data.status === 'draft') {
        publishedAt = null;
      }
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        slug,
        readingTimeMinutes,
        isPublic,
        publishedAt
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.getOne(id, userId); // verify ownership
    await this.prisma.blogPost.delete({ where: { id } });
  }

  async setPublishStatus(id: string, userId: string, status: 'draft' | 'published') {
    return this.update(id, userId, { status });
  }

  async updateCover(id: string, userId: string, coverImageUrl: string) {
    await this.getOne(id, userId);
    return this.prisma.blogPost.update({
      where: { id },
      data: { coverImageUrl },
    });
  }

  async getPublicPosts(username: string) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: username },
      select: { userId: true },
    });
    if (!profile) throw new AppError('User not found', 404);

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId: profile.userId },
      select: { id: true },
    });
    if (!portfolio) throw new AppError('Portfolio not found', 404);

    return this.prisma.blogPost.findMany({
      where: { portfolioId: portfolio.id, status: 'published' },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true, title: true, slug: true, excerpt: true, 
        coverImageUrl: true, tags: true, 
        readingTimeMinutes: true, publishedAt: true,
      }
    });
  }

  async getPublicPostBySlug(username: string, slug: string) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: username },
      select: { userId: true },
    });
    if (!profile) throw new AppError('User not found', 404);

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId: profile.userId },
      select: { id: true },
    });
    if (!portfolio) throw new AppError('Portfolio not found', 404);

    const post = await this.prisma.blogPost.findUnique({
      where: { portfolioId_slug: { portfolioId: portfolio.id, slug } },
    });

    if (!post || post.status !== 'published') {
      throw new AppError('Post not found', 404);
    }
    
    return post;
  }
}
