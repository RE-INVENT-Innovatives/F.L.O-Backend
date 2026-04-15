import { FastifyInstance } from 'fastify';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { authenticate } from '../../middleware/authenticate';

export async function seoRoutes(fastify: FastifyInstance) {
  const geminiKey = fastify.config.GEMINI_API_KEY;
  const service = new SeoService(fastify.prisma, geminiKey);
  const controller = new SeoController(service);

  const auth = { preHandler: [authenticate] };

  fastify.get('/', { ...auth }, controller.get.bind(controller));
  fastify.put('/', { ...auth }, controller.update.bind(controller));
  fastify.post('/og-image', { ...auth }, controller.uploadOgImage.bind(controller));
  fastify.post('/analyze', { ...auth }, controller.analyze.bind(controller));
}
