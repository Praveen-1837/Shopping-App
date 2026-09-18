import re

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'r') as f:
    content = f.read()

# Make it filter by deliveryPartnerId
old_query = """    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });"""

new_query = """    
    // Pagination parameters
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const skip = (page - 1) * limit;
    const historyMode = req.query.history === 'true';

    const whereClause: any = {};
    
    if (dbUser.role === Role.DELIVERY_PARTNER) {
      whereClause.deliveryPartnerId = dbUser.id;
    }

    if (historyMode) {
      whereClause.status = OrderStatus.DELIVERED;
    } else {
      whereClause.status = {
        in: [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],
      };
    }

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: {
          items: true,
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause })
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });"""

content = content.replace(old_query, new_query)

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'w') as f:
    f.write(content)
