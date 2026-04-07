import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';
import 'dotenv/config';

const schema = {
  type: 'object',
  required: ['PORT', 'JWT_SECRET', 'JWT_REFRESH_SECRET'],
  properties: {
    PORT: { type: 'number', default: 3001 },
    HOST: { type: 'string', default: '0.0.0.0' },
    NODE_ENV: { type: 'string', default: 'development' },
    DB_TYPE: { type: 'string', enum: ['local', 'supabase'], default: 'local' },
    DATABASE_URL: { type: 'string' },
    LOCAL_DATABASE_URL: { type: 'string' },
    SUPABASE_DATABASE_URL: { type: 'string' },
    SUPABASE_DIRECT_URL: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    JWT_REFRESH_SECRET: { type: 'string' },
    JWT_ACCESS_EXPIRY: { type: 'string', default: '15m' },
    JWT_REFRESH_EXPIRY: { type: 'string', default: '7d' },
    GITHUB_API_TOKEN: { type: 'string' },
    GEMINI_API_KEY: { type: 'string' },
    OPENROUTER_API_KEY: { type: 'string' },
    FRONTEND_URL: { type: 'string', default: 'http://localhost:3000' },
  },
};

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number;
      HOST: string;
      NODE_ENV: string;
      DB_TYPE: 'local' | 'supabase';
      DATABASE_URL?: string;
      LOCAL_DATABASE_URL?: string;
      SUPABASE_DATABASE_URL?: string;
      SUPABASE_DIRECT_URL?: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_ACCESS_EXPIRY: string;
      JWT_REFRESH_EXPIRY: string;
      GITHUB_API_TOKEN?: string;
      GEMINI_API_KEY?: string;
      OPENROUTER_API_KEY?: string;
      FRONTEND_URL: string;
    };
  }
}

async function envPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyEnv, {
    schema,
    data: process.env,
  });
}

export default fp(envPlugin);
