import { FastifyInstance } from 'fastify';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { authenticate } from '../../middleware/authenticate';

export async function inboxRoutes(fastify: FastifyInstance) {
  const service = new InboxService(fastify.prisma);
  const controller = new InboxController(service);

  // Public endpoint for contact form
  fastify.post('/contact', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'subject', 'message', 'portfolioUsername'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          subject: { type: 'string' },
          message: { type: 'string' },
          portfolioUsername: { type: 'string' },
        },
      },
    },
  }, controller.createContactMessage.bind(controller));

  // Authenticated endpoints
  const auth = { preHandler: [authenticate] };

  fastify.get('/', { ...auth }, controller.getAll.bind(controller));
  fastify.get('/stats', { ...auth }, controller.getStats.bind(controller));
  fastify.patch('/:id/read', { ...auth }, controller.markAsRead.bind(controller));
  fastify.patch('/:id/unread', { ...auth }, controller.markAsUnread.bind(controller));
  fastify.patch('/:id/star', { ...auth }, controller.toggleStar.bind(controller));
  fastify.delete('/:id', { ...auth }, controller.delete.bind(controller));
  fastify.delete('/', { ...auth }, controller.deleteAll.bind(controller));
}
