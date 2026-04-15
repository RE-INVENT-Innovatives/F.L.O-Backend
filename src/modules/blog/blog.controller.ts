import { FastifyReply, FastifyRequest } from 'fastify';
import { BlogService } from './blog.service';
import { AppError } from '../../utils/errors';
import fs from 'fs/promises';
import path from 'path';

export class BlogController {
  constructor(private blogService: BlogService) {}

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.blogService.getAll(userId);
    return reply.send(result);
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.blogService.getOne(id, userId);
    return reply.send(result);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.blogService.create(userId, request.body);
    return reply.status(201).send(result);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.blogService.update(id, userId, request.body);
    return reply.send(result);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    await this.blogService.delete(id, userId);
    return reply.status(204).send();
  }

  async publish(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.blogService.setPublishStatus(id, userId, 'published');
    return reply.send(result);
  }

  async unpublish(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.blogService.setPublishStatus(id, userId, 'draft');
    return reply.send(result);
  }

  async uploadCover(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    
    // First confirm ownership
    await this.blogService.getOne(id, userId);

    const data = await request.file();
    if (!data) throw new AppError('No image uploaded', 400);

    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(publicDir, { recursive: true });
    
    const filename = `cover-${Date.now()}-${data.filename}`;
    const filePath = path.join(publicDir, filename);
    
    const buffer = await data.toBuffer();
    await fs.writeFile(filePath, buffer);
    
    const url = `/uploads/${filename}`;
    await this.blogService.updateCover(id, userId, url);
    
    return reply.send({ url });
  }

  async getPublicPosts(request: FastifyRequest, reply: FastifyReply) {
    const { username } = request.params as any;
    const result = await this.blogService.getPublicPosts(username);
    return reply.send(result);
  }

  async getPublicPostBySlug(request: FastifyRequest, reply: FastifyReply) {
    const { username, slug } = request.params as any;
    const result = await this.blogService.getPublicPostBySlug(username, slug);
    return reply.send(result);
  }
}
