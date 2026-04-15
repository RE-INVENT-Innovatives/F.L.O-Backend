import { FastifyInstance } from 'fastify';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { blogSchema } from './blog.schema';
import { authenticate } from '../../middleware/authenticate';

export async function blogRoutes(fastify: FastifyInstance) {
  const service = new BlogService(fastify.prisma);
  const controller = new BlogController(service);

  const auth = { preHandler: [authenticate] };

  // Protected Routes
  fastify.get('/', { ...auth }, controller.getAll.bind(controller));
  fastify.get('/:id', { ...auth }, controller.getOne.bind(controller));
  fastify.post('/', { ...auth, schema: blogSchema.create }, controller.create.bind(controller));
  fastify.put('/:id', { ...auth, schema: blogSchema.update }, controller.update.bind(controller));
  fastify.delete('/:id', { ...auth }, controller.delete.bind(controller));
  
  fastify.patch('/:id/publish', { ...auth }, controller.publish.bind(controller));
  fastify.patch('/:id/unpublish', { ...auth }, controller.unpublish.bind(controller));
  fastify.post('/:id/cover', { ...auth }, controller.uploadCover.bind(controller));
}

export async function publicBlogRoutes(fastify: FastifyInstance) {
  const service = new BlogService(fastify.prisma);
  const controller = new BlogController(service);

  fastify.get('/:username/blog', {}, controller.getPublicPosts.bind(controller));
  fastify.get('/:username/blog/:slug', {}, controller.getPublicPostBySlug.bind(controller));
}
