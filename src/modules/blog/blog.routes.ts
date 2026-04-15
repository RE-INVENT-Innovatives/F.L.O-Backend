import { FastifyInstance } from 'fastify';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { authenticate } from '../../middleware/authenticate';

export async function blogRoutes(fastify: FastifyInstance) {
  const service = new BlogService(fastify.prisma);
  const controller = new BlogController(service);

  const auth = { preHandler: [authenticate] };

  // Authenticated routes for managing own posts
  fastify.get('/', { ...auth }, controller.getAll.bind(controller));
  fastify.get('/:id', { ...auth }, controller.getById.bind(controller));
  fastify.post('/', { ...auth }, controller.create.bind(controller));
  fastify.put('/:id', { ...auth }, controller.update.bind(controller));
  fastify.delete('/:id', { ...auth }, controller.delete.bind(controller));
  fastify.patch('/:id/publish', { ...auth }, controller.publish.bind(controller));
  fastify.patch('/:id/unpublish', { ...auth }, controller.unpublish.bind(controller));
  fastify.post('/:id/cover', { ...auth }, controller.uploadCoverImage.bind(controller));

  // Public routes for viewing published posts by username
  fastify.get('/public/:username/blog', controller.getPublishedByUsername.bind(controller));
  fastify.get('/public/:username/blog/:slug', controller.getPublishedPostByUsername.bind(controller));
}
