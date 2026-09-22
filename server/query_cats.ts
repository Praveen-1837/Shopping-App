import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const cats = await prisma.product.groupBy({
    by: ['category'],
    _count: { category: true }
  });
  console.log(cats);
}
run();
