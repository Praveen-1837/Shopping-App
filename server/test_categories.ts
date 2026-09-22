import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("=== SETUP ===");
  // 1. Find a farmer user
  let seller = await prisma.user.findFirst({ where: { role: 'FARMER' } });
  if (!seller) {
    seller = await prisma.user.findFirst();
    if (!seller) return console.log("No users found");
  }

  // 2. Add products
  console.log("Adding 2 Organic Produce items...");
  await prisma.product.createMany({
    data: [
      { title: 'Fresh Test Tomatoes', description: 'Test', price: 50, category: 'ORGANIC_PRODUCE', sellerId: seller.id, status: 'ACTIVE' },
      { title: 'Fresh Test Potatoes', description: 'Test', price: 40, category: 'ORGANIC_PRODUCE', sellerId: seller.id, status: 'ACTIVE' }
    ]
  });

  console.log("Adding 1 Artisan Crafts item...");
  await prisma.product.create({
    data: { title: 'Handcrafted Test Basket', description: 'Test', price: 500, category: 'ARTISAN_CRAFTS', sellerId: seller.id, status: 'ACTIVE' }
  });

  console.log("\n=== VERIFICATION ===");
  
  // Test Organic Produce (frontend passes "Organic Produce")
  const orgQuery = 'Organic Produce';
  let normalizedOrg = orgQuery;
  if (orgQuery.toLowerCase() === 'organic produce') normalizedOrg = 'ORGANIC_PRODUCE';
  
  const orgResults = await prisma.product.findMany({
    where: {
      AND: [
        { OR: [{ category: { equals: orgQuery, mode: 'insensitive' } }, { category: { equals: normalizedOrg, mode: 'insensitive' } }] },
        { status: 'ACTIVE' }
      ]
    }
  });
  console.log(`Organic Produce Count: ${orgResults.length}`);
  console.log(`Organic Produce Sample: ${orgResults.map(p => p.title).join(', ')}`);

  // Test Artisan Crafts (frontend passes "Artisan Crafts")
  const artQuery = 'Artisan Crafts';
  let normalizedArt = artQuery;
  if (artQuery.toLowerCase() === 'artisan crafts') normalizedArt = 'ARTISAN_CRAFTS';

  const artResults = await prisma.product.findMany({
    where: {
      AND: [
        { OR: [{ category: { equals: artQuery, mode: 'insensitive' } }, { category: { equals: normalizedArt, mode: 'insensitive' } }] },
        { status: 'ACTIVE' }
      ]
    }
  });
  console.log(`Artisan Crafts Count: ${artResults.length}`);
  console.log(`Artisan Crafts Sample: ${artResults.map(p => p.title).join(', ')}`);

  // Clean up
  await prisma.product.deleteMany({
    where: { title: { contains: 'Test ' } }
  });
}
run();
