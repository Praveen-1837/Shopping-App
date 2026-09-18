const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, title: true, images: true } });
  const multiImage = products.filter(p => p.images && p.images.length > 1);
  console.log(`Total products: ${products.length}`);
  console.log(`Products with multiple images: ${multiImage.length}`);
}

main().finally(() => prisma.$disconnect())
