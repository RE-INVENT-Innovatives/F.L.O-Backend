import { FastifyInstance } from 'fastify';
import { TestimonialController } from './testimonial.controller';
import { TestimonialService } from './testimonial.service';
import { testimonialSchema } from './testimonial.schema';
import { authenticate } from '../../middleware/authenticate';

export async function testimonialRoutes(fastify: FastifyInstance) {
  const service = new TestimonialService(fastify.prisma);
  const controller = new TestimonialController(service);

  const auth = { preHandler: [authenticate] };

  fastify.get('/', { ...auth }, controller.getAll.bind(controller));
  fastify.get('/public/:username', {}, controller.getPublic.bind(controller));
  fastify.post('/', { ...auth, schema: testimonialSchema.create }, controller.create.bind(controller));
  fastify.post('/public/:username', {}, controller.createPublic.bind(controller));
  fastify.patch('/:id', { ...auth, schema: testimonialSchema.update }, controller.update.bind(controller));
  fastify.patch('/:id/approve', { ...auth }, controller.approve.bind(controller));
  fastify.delete('/:id', { ...auth }, controller.delete.bind(controller));
}
