import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

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
