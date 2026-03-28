import { FastifyReply, FastifyRequest } from 'fastify';
import { TestimonialService } from './testimonial.service';

export class TestimonialController {
  constructor(private testimonialService: TestimonialService) {}

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.testimonialService.getAll(userId);
    return reply.send(result);
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const result = await this.testimonialService.create(userId, request.body);
    return reply.status(201).send(result);
  }

  async createPublic(request: FastifyRequest, reply: FastifyReply) {
    const { username } = request.params as any;
    const result = await this.testimonialService.createPublic(username, request.body);
    return reply.status(201).send(result);
  }

  async getPublic(request: FastifyRequest, reply: FastifyReply) {
    const { username } = request.params as any;
    const result = await this.testimonialService.getPublic(username);
    return reply.send(result);
  }

  async approve(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.testimonialService.approve(id, userId);
    return reply.send(result);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    const result = await this.testimonialService.update(id, userId, request.body);
    return reply.send(result);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).id;
    const { id } = request.params as any;
    await this.testimonialService.delete(id, userId);
    return reply.status(204).send();
  }
}
