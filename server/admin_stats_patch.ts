import { prisma } from './src/config/db';

export const getAdminStatsWithTrend = async () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Revenue
  const revTotal = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: 'SUCCESS' },
  });
  const revCurrent = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: 'SUCCESS', createdAt: { gte: currentMonthStart } },
  });
  const revLast = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: 'SUCCESS', createdAt: { gte: lastMonthStart, lt: currentMonthStart } },
  });

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  const revenueTrend = calcTrend(Number(revCurrent._sum.total || 0), Number(revLast._sum.total || 0));

  // Orders
  const totalOrders = await prisma.order.count();
  const currOrders = await prisma.order.count({ where: { createdAt: { gte: currentMonthStart } } });
  const lastOrders = await prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });
  const ordersTrend = calcTrend(currOrders, lastOrders);

  // Products
  const totalProducts = await prisma.product.count();
  const currProducts = await prisma.product.count({ where: { createdAt: { gte: currentMonthStart } } });
  const lastProducts = await prisma.product.count({ where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });
  const productsTrend = calcTrend(currProducts, lastProducts);

  // Users
  const totalUsers = await prisma.user.count();
  const currUsers = await prisma.user.count({ where: { createdAt: { gte: currentMonthStart } } });
  const lastUsers = await prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });
  const usersTrend = calcTrend(currUsers, lastUsers);

  // Stores
  const storeCondition = { role: { in: ['SELLER', 'FARMER', 'ARTISAN'] as any } };
  const totalStores = await prisma.user.count({ where: storeCondition });

  return {
    totalRevenue: Number(revTotal._sum.total || 0),
    revenueTrend,
    currentMonthRevenue: Number(revCurrent._sum.total || 0),
    totalOrders,
    ordersTrend,
    totalProducts,
    productsTrend,
    totalUsers,
    usersTrend,
    totalStores,
  };
};

// Analytics Data
export const getAdminAnalytics = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();

  // 1. Monthly Revenue for the year
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: 'SUCCESS',
      createdAt: { gte: new Date(currentYear, 0, 1) }
    },
    select: { total: true, createdAt: true }
  });

  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
    revenue: 0
  }));

  orders.forEach(order => {
    const month = order.createdAt.getMonth();
    monthlyRevenue[month].revenue += Number(order.total);
  });

  // 2. Customer Statistic (New vs Returning this month)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthOrders = await prisma.order.findMany({
    where: { createdAt: { gte: currentMonthStart } },
    select: { userId: true }
  });

  const uniqueUsersThisMonth = [...new Set(currentMonthOrders.map(o => o.userId).filter(Boolean))];
  
  let newCustomers = 0;
  let returningCustomers = 0;

  for (const userId of uniqueUsersThisMonth) {
    if (!userId) continue;
    const firstOrder = await prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    if (firstOrder && firstOrder.createdAt >= currentMonthStart) {
      newCustomers++;
    } else {
      returningCustomers++;
    }
  }

  // 3. Top Performing Categories
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        paymentStatus: 'SUCCESS',
        createdAt: { gte: currentMonthStart }
      }
    },
    include: {
      product: true
    }
  });

  const categoryMap: Record<string, number> = {};
  orderItems.forEach(item => {
    if (item.product && item.product.categoryId) {
      const cat = item.product.categoryId;
      const lineTotal = Number(item.price) * item.quantity;
      categoryMap[cat] = (categoryMap[cat] || 0) + lineTotal;
    }
  });

  // Need to get category names
  const categoryIds = Object.keys(categoryMap);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } }
  });
  
  const topCategories = categories.map(c => ({
    name: c.name,
    revenue: categoryMap[c.id]
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return {
    monthlyRevenue,
    customerStats: [
      { name: 'New', value: newCustomers },
      { name: 'Returning', value: returningCustomers }
    ],
    topCategories
  };
};
