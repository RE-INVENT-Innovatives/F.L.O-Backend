import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

async function swaggerPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'F.L.O API',
        description: 'Backend API for F.L.O Portfolio Generator. Click the "Authorize" button to log in with your email and password.',
        version: '1.0.0',
      },
      servers: [
        {
          url: '/',
          description: 'Default server (relative)',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'oauth2',
            flows: {
              password: {
                tokenUrl: '/api/auth/swagger-login',
                scopes: {},
              },
            },
          },
        },
      },
      // Note: We don't set global security here to allow login/register to remain public in the UI
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });
}

export default fp(swaggerPlugin);
