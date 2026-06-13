import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

/**
 * Prisma 7 Configuration (prisma.config.ts)
 *
 * The `datasource.url` here is used ONLY by the Prisma CLI (prisma migrate, prisma db push, etc.).
 * Set DATABASE_URL in Vercel → Project Settings → Environment Variables.
 *
 * Note: `directUrl` is NOT a valid property in this config — it is passed separately
 * to the PrismaClient adapter in src/plugins/prisma.ts via the pg.Pool connection string.
 */
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});

