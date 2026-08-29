import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import PDFDocument from 'pdfkit';

async function getDbUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    throw new Error('Authenticated user not found');
  }
  return user;
}

// GET /api/v1/seller/analytics/sales
export const getSellerSalesAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const period = (req.query.period as string) || 'daily'; // 'daily' | 'weekly' | 'monthly'

    // Fetch successful order items for this seller
    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          sellerId: dbUser.id,
        },
        order: {
          paymentStatus: 'SUCCESS',
        },
      },
      include: {
        order: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: {
        order: { createdAt: 'asc' },
      },
    });

    let totalRevenue = 0;
    const orderIds = new Set<string>();
    const groupedMap: Record<string, { label: string; revenue: number; orders: Set<string> }> = {};

    orderItems.forEach((item) => {
      const price = Number(item.price);
      const lineTotal = price * item.quantity;
      totalRevenue += lineTotal;
      orderIds.add(item.order.id);

      const d = new Date(item.order.createdAt);
      let label = d.toISOString().slice(0, 10); // Default YYYY-MM-DD

      if (period === 'monthly') {
        label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
        label = `Week of ${firstDay.toISOString().slice(5, 10)}`;
      }

      if (!groupedMap[label]) {
        groupedMap[label] = { label, revenue: 0, orders: new Set() };
      }
      groupedMap[label].revenue += lineTotal;
      groupedMap[label].orders.add(item.order.id);
    });

    const chartData = Object.values(groupedMap).map((entry) => ({
      label: entry.label,
      revenue: Number(entry.revenue.toFixed(2)),
      orders: entry.orders.size,
    }));

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders: orderIds.size,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/seller/alerts
export const getSellerAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    // 1. Low stock products alert
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId: dbUser.id },
      select: { id: true, title: true, stock: true, lowStockThreshold: true, images: true },
    });

    const lowStockProducts = sellerProducts.filter((p) => p.stock <= p.lowStockThreshold);

    // 2. SLA breached orders alert (unfulfilled orders > 48h old)
    const SLA_HOURS = 48;
    const slaCutoff = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);

    const slaBreachedOrderItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: dbUser.id },
        order: {
          status: { in: ['PENDING', 'CONFIRMED', 'PACKED'] },
          createdAt: { lt: slaCutoff },
        },
      },
      include: {
        order: {
          select: { id: true, status: true, createdAt: true, user: { select: { name: true, email: true } } },
        },
        product: { select: { title: true } },
      },
    });

    // Deduplicate orders
    const orderMap = new Map<string, any>();
    slaBreachedOrderItems.forEach((item) => {
      if (!orderMap.has(item.order.id)) {
        orderMap.set(item.order.id, {
          orderId: item.order.id,
          status: item.order.status,
          createdAt: item.order.createdAt,
          customerName: item.order.user?.name,
          productTitle: item.product?.title,
        });
      }
    });

    const slaBreachedOrders = Array.from(orderMap.values());

    res.status(200).json({
      success: true,
      data: {
        lowStockProducts,
        slaBreachedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/seller/profile
export const getSellerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);

    let profile = await prisma.sellerProfile.findUnique({
      where: { userId: dbUser.id },
    });

    if (!profile) {
      profile = await prisma.sellerProfile.create({
        data: {
          userId: dbUser.id,
          contactEmail: dbUser.email,
          badges: ['Verified Seller'],
        },
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/seller/profile
export const updateSellerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const { logoUrl, bannerUrl, bio, contactEmail, contactPhone, socialLinks, badges } = req.body;

    const profile = await prisma.sellerProfile.upsert({
      where: { userId: dbUser.id },
      update: {
        logoUrl,
        bannerUrl,
        bio,
        contactEmail,
        contactPhone,
        socialLinks: socialLinks || {},
        badges: badges || [],
      },
      create: {
        userId: dbUser.id,
        logoUrl,
        bannerUrl,
        bio,
        contactEmail: contactEmail || dbUser.email,
        contactPhone,
        socialLinks: socialLinks || {},
        badges: badges || ['Verified Seller'],
      },
    });

    res.status(200).json({
      success: true,
      message: 'Store profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/orders/:id/packing-slip
export const generatePackingSlip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { title: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PackingSlip-${order.id.slice(0, 8)}.pdf`);

    doc.pipe(res);

    // Document Header
    doc.font('Helvetica-Bold').fontSize(20).text('ECOMARKET PACKING SLIP', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text(`Order ID: #${order.id}`, { align: 'center' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // Shipping Address Box
    doc.font('Helvetica-Bold').fontSize(12).text('DELIVERY SHIP-TO ADDRESS:');
    doc.font('Helvetica').fontSize(10).text(`Recipient Name: ${order.user?.name || 'Customer'}`);
    doc.text(`Email: ${order.user?.email || 'N/A'}`);
    if (order.user?.phone) doc.text(`Phone: ${order.user.phone}`);
    if (order.deliveryAddress) {
      const addr = typeof order.deliveryAddress === 'string' ? order.deliveryAddress : JSON.stringify(order.deliveryAddress);
      doc.text(`Address: ${addr}`);
    }
    doc.moveDown(1.5);

    // Items Table Header (No Prices!)
    doc.font('Helvetica-Bold').fontSize(12).text('ITEMS TO PACK');
    doc.moveDown(0.5);

    doc.fontSize(10).text('Item Description', 50, doc.y, { width: 350 });
    doc.text('Quantity', 420, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    order.items.forEach((item) => {
      const title = item.product?.title || item.course?.title || 'Item';
      const y = doc.y;
      doc.text(title, 50, y, { width: 350 });
      doc.text(String(item.quantity), 420, y, { width: 100, align: 'right' });
      doc.moveDown(0.5);
    });

    doc.moveDown(2);
    doc.font('Helvetica-Oblique').fontSize(9).text('Thank you for supporting sustainable local sellers!', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/orders/:id/invoice
export const generateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }

    const dbUser = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!dbUser) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const id = req.params.id as string;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { title: true, sellerId: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
      return;
    }

    // Ownership check: Buyer who placed order, Admin, or Seller with products in order
    const isBuyer = order.userId === dbUser.id;
    const isAdmin = dbUser.role === 'ADMIN';
    const isOwningSeller = order.items.some((item) => item.product?.sellerId === dbUser.id);

    if (!isBuyer && !isAdmin && !isOwningSeller) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not authorized to download invoice for this order' } });
      return;
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${order.id.slice(0, 8)}.pdf`);

    doc.pipe(res);

    // Header
    doc.font('Helvetica-Bold').fontSize(22).text('TAX INVOICE', { align: 'right' });
    doc.fontSize(14).text('EcoMarket Multi-Vendor Platform', 50, 50);
    doc.font('Helvetica').fontSize(9).text('Sustainable Marketplace Inc.', 50, 75);
    doc.moveDown(2);

    // Invoice Meta & Customer
    const metaY = doc.y;
    doc.fontSize(10).text(`Invoice No: INV-${order.id.slice(0, 8)}`, 50, metaY);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, metaY + 15);
    doc.text(`Payment Method: ${order.paymentMethod || 'Mock Payment'}`, 50, metaY + 30);
    doc.text(`Payment Status: ${order.paymentStatus}`, 50, metaY + 45);

    doc.text(`Billed To: ${order.user?.name || 'Customer'}`, 320, metaY);
    doc.text(`Email: ${order.user?.email || 'N/A'}`, 320, metaY + 15);
    doc.moveDown(4);

    // Items Table with Prices
    doc.font('Helvetica-Bold').fontSize(11).text('Item Description', 50, doc.y);
    doc.text('Qty', 280, doc.y);
    doc.text('Unit Price', 350, doc.y);
    doc.text('Line Total', 450, doc.y, { align: 'right' });
    doc.moveDown(0.5);

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica');
    order.items.forEach((item) => {
      const title = item.product?.title || item.course?.title || 'Item';
      const unitPrice = Number(item.price);
      const lineTotal = unitPrice * item.quantity;
      const y = doc.y;

      doc.fontSize(10).text(title, 50, y, { width: 220 });
      doc.text(String(item.quantity), 280, y);
      doc.text(`₹${unitPrice.toFixed(2)}`, 350, y);
      doc.text(`₹${lineTotal.toFixed(2)}`, 450, y, { align: 'right' });
      doc.moveDown(0.8);
    });

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(12).text(`TOTAL AMOUNT PAID: ₹${Number(order.total).toFixed(2)}`, { align: 'right' });

    doc.moveDown(2);
    doc.font('Helvetica-Oblique').fontSize(9).text('This is a computer-generated tax invoice.', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
