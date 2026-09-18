import re

with open("server/src/modules/admin/adminController.ts", "r") as f:
    content = f.read()

# Replace getAdminStats entirely
getAdminStatsPatch = """export const getAdminStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const revTotal = await prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'SUCCESS' } });
    const revCurrent = await prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'SUCCESS', createdAt: { gte: currentMonthStart } } });
    const revLast = await prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'SUCCESS', createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return null;
      return ((curr - prev) / prev) * 100;
    };

    const revenueTrend = calcTrend(Number(revCurrent._sum.total || 0), Number(revLast._sum.total || 0));

    const totalOrders = await prisma.order.count();
    const currOrders = await prisma.order.count({ where: { createdAt: { gte: currentMonthStart } } });
    const lastOrders = await prisma.order.count({ where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });
    const ordersTrend = calcTrend(currOrders, lastOrders);

    const totalProducts = await prisma.product.count();
    const currProducts = await prisma.product.count({ where: { createdAt: { gte: currentMonthStart } } });
    const lastProducts = await prisma.product.count({ where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });
    const productsTrend = calcTrend(currProducts, lastProducts);

    const totalUsers = await prisma.user.count();
    const currUsers = await prisma.user.count({ where: { createdAt: { gte: currentMonthStart } } });
    const lastUsers = await prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: currentMonthStart } } });
    const usersTrend = calcTrend(currUsers, lastUsers);

    const totalStores = await prisma.user.count({ where: { role: { in: ['SELLER', 'FARMER', 'ARTISAN'] } } });

    res.status(200).json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    next(error);
  }
};"""

analyticsPatch = """
// GET /api/v1/admin/analytics
export const getAdminAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

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
      if (item.product && item.product.category) {
        const cat = item.product.category;
        const lineTotal = Number(item.price) * item.quantity;
        categoryMap[cat] = (categoryMap[cat] || 0) + lineTotal;
      }
    });
    
    const topCategories = Object.keys(categoryMap).map(cat => ({ name: cat, revenue: categoryMap[cat] })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        monthlyRevenue,
        customerStats: [
          { name: 'New Customers', value: newCustomers },
          { name: 'Returning', value: returningCustomers }
        ],
        topCategories
      }
    });
  } catch (error) {
    next(error);
  }
};
"""

# Regex replacement
pattern = r"export const getAdminStats = async .*?};"
content = re.sub(pattern, getAdminStatsPatch, content, flags=re.DOTALL)

content += analyticsPatch

with open("server/src/modules/admin/adminController.ts", "w") as f:
    f.write(content)
