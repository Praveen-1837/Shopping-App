const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const products = await prisma.product.findMany();
  
  for (const product of products) {
    let newImages = product.images || [];
    if (newImages.length === 0) {
      newImages = [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'
      ];
    } else if (newImages.length === 1) {
      // Add two more placeholder images to whatever they already have
      newImages.push('https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600');
      newImages.push('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600');
    }
    
    await prisma.product.update({
      where: { id: product.id },
      data: { images: newImages }
    });
  }
  
  console.log("Successfully updated all existing products to have 3 images!");
}

main().finally(() => prisma.$disconnect())
