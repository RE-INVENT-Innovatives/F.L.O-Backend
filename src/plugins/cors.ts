import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        cb(null, true);
        return;
      }

      const isDevelopment = process.env.NODE_ENV !== 'production';
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (isDevelopment && isLocalhost) {
        cb(null, true);
        return;
      }

      // Add production origins here when ready
      cb(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    credentials: true,
  });
}

export default fp(corsPlugin);
