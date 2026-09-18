import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const prod = await prisma.product.findFirst();
  console.log(prod?.images);
}
main();
