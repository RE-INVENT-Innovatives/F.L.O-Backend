import { FastifyInstance } from 'fastify';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { seoSchema } from './seo.schema';
import { authenticate } from '../../middleware/authenticate';

export async function seoRoutes(fastify: FastifyInstance) {
  const service = new SeoService(fastify.prisma);
  const controller = new SeoController(service);

  const auth = { preHandler: [authenticate] };

  fastify.get('/', { ...auth }, controller.getSettings.bind(controller));
  fastify.put('/', { ...auth, schema: seoSchema.upsert }, controller.upsertSettings.bind(controller));
  fastify.post('/analyze', { ...auth }, controller.analyze.bind(controller));
  fastify.post('/og-image', { ...auth }, controller.uploadOgImage.bind(controller));
}
