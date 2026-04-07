import { FastifyInstance } from 'fastify';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { assetSchema } from './asset.schema';
import { authenticate } from '../../middleware/authenticate';

export async function assetRoutes(fastify: FastifyInstance) {
  const service = new AssetService(fastify.prisma, fastify.config.DB_TYPE);
  const controller = new AssetController(service);

  const auth = { preHandler: [authenticate] };

  // Note: /upload must be registered with multipart plugin enabled globally which it is in server setup
  fastify.get('/', { ...auth, schema: assetSchema.get }, controller.getAll.bind(controller));
  fastify.post('/upload', { ...auth }, controller.upload.bind(controller));
  fastify.delete('/:id', { ...auth }, controller.delete.bind(controller));
}
