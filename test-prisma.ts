import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';
config();

async function test() {
  console.log('Testing PrismaClient properties...');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  console.log('Prisma keys:', Object.keys(prisma).length ? Object.keys(prisma) : 'Likely Proxied');
  console.log('Testimonial check:', typeof (prisma as any).testimonial);
  console.log('Asset check:', typeof (prisma as any).asset);
  
  // Close
  await pool.end();
}

test().catch(console.error);
