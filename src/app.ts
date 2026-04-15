// Triggering server restart to pick up generated Prisma client changes.
import fastify, { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import envPlugin from './config/env';
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';
import swaggerPlugin from './plugins/swagger';
import corsPlugin from './plugins/cors';
import rateLimitPlugin from './plugins/rate-limit';
import multipartPlugin from './plugins/multipart';
import { AppError } from './utils/errors';
import { authRoutes } from './modules/auth/auth.routes';
import { githubRoutes } from './modules/github/github.routes';
import { profileRoutes } from './modules/profile/profile.routes';
import { portfolioRoutes } from './modules/portfolio/portfolio.routes';
import { deployRoutes } from './modules/deploy/deploy.routes';
import { aiRoutes } from './modules/ai/ai.routes';
import { testimonialRoutes } from './modules/testimonial/testimonial.routes';
import { assetRoutes } from './modules/asset/asset.routes';
import { inboxRoutes } from './modules/inbox/inbox.routes';
import { seoRoutes } from './modules/seo/seo.routes';
import { blogRoutes } from './modules/blog/blog.routes';

export async function buildApp(): Promise<FastifyInstance> {
  // pino-pretty is a devDependency - only use it locally, never in production (Vercel)
  const isDev = process.env.NODE_ENV !== 'production';

  const app = fastify({
    logger: isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : true, // plain JSON logging for production - no extra packages needed
  });

  // Register core plugins
  await app.register(envPlugin);
  await app.register(helmet);
  await app.register(compress);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(swaggerPlugin);
  await app.register(multipartPlugin);

  // Register modules
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(githubRoutes, { prefix: '/api/github' });
  await app.register(profileRoutes, { prefix: '/api/profile' });
  await app.register(portfolioRoutes, { prefix: '/api/portfolio' });
  await app.register(deployRoutes, { prefix: '/api/deploy' });
  await app.register(aiRoutes, { prefix: '/api/ai' });
  await app.register(testimonialRoutes, { prefix: '/api/testimonials' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(inboxRoutes, { prefix: '/api/inbox' });
  await app.register(seoRoutes, { prefix: '/api/seo' });
  await app.register(blogRoutes, { prefix: '/api/blog' });

  // Health check route
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  // Global error handler
  app.setErrorHandler((error: any, request, reply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
      });
    }

    reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  return app;
}
