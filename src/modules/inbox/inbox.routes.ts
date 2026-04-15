import { FastifyInstance } from 'fastify';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { inboxSchema } from './inbox.schema';
import { authenticate } from '../../middleware/authenticate';

export async function inboxRoutes(fastify: FastifyInstance) {
  const service = new InboxService(fastify.prisma);
  const controller = new InboxController(service);

  const auth = { preHandler: [authenticate] };

  // Public endpoint
  fastify.post('/contact', { schema: inboxSchema.createPublic }, controller.createContactMessage.bind(controller));

  // Protected endpoints
  fastify.get('/', { ...auth }, controller.getAll.bind(controller));
  fastify.get('/stats', { ...auth }, controller.getStats.bind(controller));
  fastify.patch('/:id/read', { ...auth }, controller.markRead.bind(controller));
  fastify.patch('/:id/unread', { ...auth }, controller.markUnread.bind(controller));
  fastify.patch('/:id/star', { ...auth }, controller.toggleStar.bind(controller));
  fastify.delete('/:id', { ...auth }, controller.deleteOne.bind(controller));
  fastify.delete('/', { ...auth }, controller.deleteAll.bind(controller));
}
