import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Enabling vector extension on Supabase PostgreSQL...');
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
  console.log('Vector extension enabled successfully!');
}

main()
  .catch((e) => {
    console.error('Error enabling vector extension:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
