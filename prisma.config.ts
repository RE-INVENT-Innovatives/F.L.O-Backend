import { defineConfig } from '@prisma/config';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Prisma Configuration
 * Dynamically switches between Local and Supabase based on DB_TYPE.
 */
const dbType = process.env.DB_TYPE || 'local';

const getDatabaseUrl = () => {
  if (dbType === 'supabase') {
    return process.env.SUPABASE_DATABASE_URL;
  }
  return process.env.LOCAL_DATABASE_URL;
};

const getDirectUrl = () => {
  if (dbType === 'supabase') {
    return process.env.SUPABASE_DIRECT_URL;
  }
  // For local, directUrl is the same as the main URL
  return process.env.LOCAL_DATABASE_URL;
};

export default defineConfig({
  datasource: {
    url: getDatabaseUrl(),
    directUrl: getDirectUrl(),
  },
});
