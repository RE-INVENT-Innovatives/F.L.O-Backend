import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(fastify: FastifyInstance) {
  const connectionString = fastify.config.DB_TYPE === 'supabase' 
    ? fastify.config.SUPABASE_DATABASE_URL 
    : fastify.config.LOCAL_DATABASE_URL;

  if (!connectionString) {
    throw new Error(`Connection string missing for DB_TYPE: ${fastify.config.DB_TYPE}`);
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
    await pool.end();
  });
}

export default fp(prismaPlugin);
