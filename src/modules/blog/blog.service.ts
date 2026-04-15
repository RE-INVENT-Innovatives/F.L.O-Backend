import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors';

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Calculate reading time (words / 200)
function calculateReadingTime(content: string): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(wordCount / 200));
}

export class BlogService {
  constructor(private prisma: PrismaClient) {}

  async getAll(portfolioId: string) {
    const posts = await this.prisma.blogPost.findMany({
      where: { portfolioId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        tags: true,
        status: true,
        isPublic: true,
        readingTimeMinutes: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return posts;
  }

  async getById(id: string, portfolioId: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { id, portfolioId },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    return post;
  }

  async create(portfolioId: string, data: {
    title: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    status?: 'draft' | 'published';
  }) {
    let slug = generateSlug(data.title);
    
    // Ensure unique slug
    let counter = 1;
    let originalSlug = slug;
    while (await this.prisma.blogPost.findFirst({
      where: { portfolioId, slug }
    })) {
      slug = `${originalSlug}-${counter}`;
      counter++;
    }

    const readingTimeMinutes = data.content ? calculateReadingTime(data.content) : 1;
    const publishedAt = data.status === 'published' ? new Date() : null;

    return this.prisma.blogPost.create({
      data: {
        portfolioId,
        title: data.title,
        slug,
        content: data.content || '',
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        status: data.status || 'draft',
        isPublic: data.status === 'published',
        readingTimeMinutes,
        publishedAt,
      },
    });
  }

  async update(id: string, portfolioId: string, data: {
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    status?: 'draft' | 'published';
    coverImageUrl?: string;
  }) {
    const existing = await this.getById(id, portfolioId);

    const updateData: any = { ...data };

    // Regenerate slug if title changes
    if (data.title && data.title !== existing.title) {
      let slug = generateSlug(data.title);
      let counter = 1;
      let originalSlug = slug;
      while (await this.prisma.blogPost.findFirst({
        where: { portfolioId, slug, id: { not: id } }
      })) {
        slug = `${originalSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    }

    // Update reading time if content changes
    if (data.content && data.content !== existing.content) {
      updateData.readingTimeMinutes = calculateReadingTime(data.content);
    }

    // Handle publish/unpublish
    if (data.status && data.status !== existing.status) {
      if (data.status === 'published') {
        updateData.publishedAt = new Date();
        updateData.isPublic = true;
      } else {
        updateData.publishedAt = null;
        updateData.isPublic = false;
      }
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, portfolioId: string) {
    await this.getById(id, portfolioId);
    await this.prisma.blogPost.delete({ where: { id } });
  }

  async publish(id: string, portfolioId: string) {
    await this.getById(id, portfolioId);
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        status: 'published',
        isPublic: true,
        publishedAt: new Date(),
      },
    });
  }

  async unpublish(id: string, portfolioId: string) {
    await this.getById(id, portfolioId);
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        status: 'draft',
        isPublic: false,
        publishedAt: null,
      },
    });
  }

  async uploadCoverImage(id: string, portfolioId: string, filename: string, buffer: Buffer, mimetype: string) {
    await this.getById(id, portfolioId);

    const fs = await import('fs/promises');
    const path = await import('path');

    const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'blog');
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    const ext = path.extname(filename);
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    await fs.writeFile(filePath, buffer);
    const url = `/uploads/blog/${uniqueFilename}`;

    await this.prisma.blogPost.update({
      where: { id },
      data: { coverImageUrl: url },
    });

    return { url };
  }

  // Public methods for viewing published posts
  async getPublishedByUsername(username: string) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: username },
      include: { user: { include: { portfolio: true } } }
    });

    if (!profile?.user?.portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const posts = await this.prisma.blogPost.findMany({
      where: {
        portfolioId: profile.user.portfolio.id,
        status: 'published',
        isPublic: true,
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        tags: true,
        readingTimeMinutes: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    return posts;
  }

  async getPublishedPostByUsername(username: string, slug: string) {
    const profile = await this.prisma.githubProfile.findFirst({
      where: { githubLogin: username },
      include: { user: { include: { portfolio: true } } }
    });

    if (!profile?.user?.portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const post = await this.prisma.blogPost.findFirst({
      where: {
        portfolioId: profile.user.portfolio.id,
        slug,
        status: 'published',
        isPublic: true,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    return post;
  }
}
