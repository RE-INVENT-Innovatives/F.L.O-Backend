import { FastifyReply, FastifyRequest } from 'fastify';
import { BlogService } from './blog.service';

export class BlogController {
  constructor(private blogService: BlogService) {}

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const posts = await this.blogService.getAll(portfolio.id);
    return reply.send({ posts });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const post = await this.blogService.getById(id, portfolio.id);
    return reply.send(post);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const body = request.body as {
      title: string;
      content?: string;
      excerpt?: string;
      tags?: string[];
      status?: 'draft' | 'published';
    };

    const post = await this.blogService.create(portfolio.id, body);
    return reply.status(201).send(post);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const body = request.body as {
      title?: string;
      content?: string;
      excerpt?: string;
      tags?: string[];
      status?: 'draft' | 'published';
      coverImageUrl?: string;
    };

    const post = await this.blogService.update(id, portfolio.id, body);
    return reply.send(post);
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

    await this.blogService.delete(id, portfolio.id);
    return reply.status(204).send();
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const post = await this.blogService.publish(id, portfolio.id);
    return reply.send(post);
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const post = await this.blogService.unpublish(id, portfolio.id);
    return reply.send(post);
  }

  async uploadCoverImage(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as { id: string };

    const portfolio = await (request as any).prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!portfolio) {
      return reply.status(404).send({ error: 'Portfolio not found' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file provided' });
    }

    const result = await this.blogService.uploadCoverImage(
      id,
      portfolio.id,
      data.filename,
      await data.toBuffer(),
      data.mimetype
    );

    return reply.send(result);
  }

  // Public endpoints
  async getPublishedByUsername(request: FastifyRequest, reply: FastifyReply) {
    const { username } = request.params as { username: string };
    const posts = await this.blogService.getPublishedByUsername(username);
    return reply.send({ posts });
  }

  async getPublishedPostByUsername(request: FastifyRequest, reply: FastifyReply) {
    const { username, slug } = request.params as { username: string; slug: string };
    const post = await this.blogService.getPublishedPostByUsername(username, slug);
    return reply.send(post);
  }
}
