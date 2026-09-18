import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed taxonomy categories with curated tile images
  const defaultCategoryImages: Record<string, string> = {
    'Food & Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    'Artisan Crafts': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
    'Eco Living': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
    'Organic Produce': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800',
  };

  for (const [name, imageUrl] of Object.entries(defaultCategoryImages)) {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (!existing) {
      await prisma.category.create({ data: { name, imageUrl } });
    } else if (!existing.imageUrl) {
      await prisma.category.update({ where: { id: existing.id }, data: { imageUrl } });
    }
  }

  // Create demo seller user
  const sellerUser = await prisma.user.upsert({
    where: { email: 'demo-farmer@example.com' },
    update: {},
    create: {
      clerkId: 'user_demo_farmer_123',
      name: 'Ramesh Patel',
      email: 'demo-farmer@example.com',
      role: Role.FARMER,
      phone: '+919876543210',
    },
  });

  // Create demo educator user
  const educatorUser = await prisma.user.upsert({
    where: { email: 'demo-educator@example.com' },
    update: {},
    create: {
      clerkId: 'user_demo_educator_456',
      name: 'Dr. Sunita Sharma',
      email: 'demo-educator@example.com',
      role: Role.EDUCATOR,
      phone: '+919876543211',
    },
  });

  // Create demo producer profile
  const producer = await prisma.producer.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      name: 'Patel Organic Farms',
      location: 'Anand, Gujarat, India',
      story: 'Generational family farm dedicated to regenerative agriculture, soil health, and zero chemical pesticide usage.',
      practices: 'Organic composting, rain water harvesting, non-GMO heirloom seeds.',
      photos: [
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800',
      ],
    },
  });

  // Seed sample products
  const products = [
    {
      title: 'Organic Heirloom Turmeric Powder',
      description: 'Single-origin, high-curcumin Lakadong turmeric stone-ground to preserve volatile essential oils.',
      price: 349.00,
      category: 'Food & Spices',
      stock: 45,
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'
      ],
      sustainabilityTags: ['Organically Grown', 'Zero Pesticides', 'Direct Trade'],
    },
    {
      title: 'Hand-Woven Natural Cotton Tote',
      description: 'Durable, unbleached organic cotton tote bag crafted by rural artisan collectives.',
      price: 599.00,
      category: 'Artisan Crafts',
      stock: 20,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'
      ],
      sustainabilityTags: ['Handmade', 'Plastic-Free', 'Fair Wage'],
    },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findFirst({ where: { title: prod.title } });
    if (!existing) {
      await prisma.product.create({
        data: {
          sellerId: sellerUser.id,
          producerId: producer.id,
          ...prod,
        },
      });
    }
  }

  // Seed sample courses
  const courses = [
    {
      title: 'Masterclass: Regenerative Organic Farming Practices',
      description: 'Learn modern soil regeneration, bio-composting, zero-budget natural farming techniques, and eco-certification for sustainable agriculture.',
      price: 1299.00,
      durationMins: 180,
      category: 'Sustainable Agriculture',
      previewVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      certificate: true,
      modules: [
        {
          id: 'mod-1',
          title: 'Introduction to Soil Biology & Microorganisms',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 1,
        },
        {
          id: 'mod-2',
          title: 'Creating On-Farm Bio-Inputs & Jeevamrut',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 2,
        },
        {
          id: 'mod-3',
          title: 'Water Harvesting & Multi-Cropping Systems',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 3,
        },
      ],
    },
    {
      title: 'Zero-Waste Living & Home Composting Workshop',
      description: 'Step-by-step practical guide to reducing household plastic waste, managing kitchen bio-waste, and building odorless balcony compost systems.',
      price: 699.00,
      durationMins: 90,
      category: 'Eco Living',
      previewVideo: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      certificate: true,
      modules: [
        {
          id: 'mod-101',
          title: 'Audit Your Household Waste Baseline',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 1,
        },
        {
          id: 'mod-102',
          title: 'Setting Up an Odor-Free Aerobic Compost Bin',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          order: 2,
        },
      ],
    },
  ];

  for (const c of courses) {
    const existing = await prisma.course.findFirst({ where: { title: c.title } });
    if (!existing) {
      await prisma.course.create({
        data: {
          educatorId: educatorUser.id,
          ...c,
        },
      });
    }
  }

  // Seed sample promo banners
  const banners = [
    {
      title: 'Direct From Local Farmers & Eco-Artisans',
      subtitle: 'Ethically harvested organic produce, natural wellness products, and verified sustainability.',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600',
      ctaText: 'Explore Food & Spices',
      ctaLink: '/shop?category=Food%20%26%20Spices',
      order: 0,
      isActive: true,
    },
    {
      title: 'Handcrafted Artisan Crafts & Eco Living',
      subtitle: 'Plastic-free handmade products crafted by rural artisan collectives across India.',
      imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=1600',
      ctaText: 'Discover Artisan Crafts',
      ctaLink: '/shop?category=Artisan%20Crafts',
      order: 1,
      isActive: true,
    },
  ];

  for (const b of banners) {
    const existing = await prisma.promoBanner.findFirst({ where: { title: b.title } });
    if (!existing) {
      await prisma.promoBanner.create({ data: b });
    }
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
