const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function audit() {
  const models = [
    'user', 'address', 'promoBanner', 'siteSettings', 'roleApplication',
    'category', 'product', 'productEmbedding', 'review', 'sellerProfile',
    'cart', 'cartItem', 'order', 'orderItem', 'course', 'courseProgress',
    'courseEmbedding', 'supportTicket'
  ];
  
  for (const model of models) {
    try {
      if (prisma[model]) {
        await prisma[model].findFirst();
        console.log(`✅ ${model} queried successfully.`);
      }
    } catch(e) {
      console.log(`❌ ${model} failed! Error: ${e.message}`);
    }
  }
}

audit().finally(() => prisma.$disconnect())
