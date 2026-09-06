import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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
    res.setHeader('Content-Disposition', `inline; filename=PackingSlip-${order.id.slice(0, 8)}.pdf`);

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

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Invoice-${order.id.slice(0, 8)}.pdf`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    doc.pipe(res);

    // 1. Header Row
    // Left: Logo or Brand Title
    const possibleLogoPaths = [
      path.resolve(process.cwd(), '../client/src/assets/logo.png'),
      path.resolve(process.cwd(), '../client/public/favicon.png'),
      path.resolve(__dirname, '../../../../client/src/assets/logo.png'),
    ];
    let logoPath: string | null = null;
    for (const p of possibleLogoPaths) {
      if (fs.existsSync(p)) {
        logoPath = p;
        break;
      }
    }

    if (logoPath) {
      try {
        doc.image(logoPath, 40, 35, { fit: [140, 45] });
      } catch (_err) {
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#2F5233').text('EcoMarket', 40, 40);
      }
    } else {
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#2F5233').text('EcoMarket', 40, 40);
    }

    // Right: INVOICE Title
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#2F5233').text('INVOICE', 350, 35, { align: 'right', width: 205 });
    doc.font('Helvetica').fontSize(8).fillColor('#64748B').text('EcoMarket Sustainable Marketplace', 350, 64, { align: 'right', width: 205 });

    // Top Divider Line
    doc.moveTo(40, 90).lineTo(555, 90).strokeColor('#E2E8F0').lineWidth(1).stroke();

    // 2. Second Row: Left/Right Split (BILL TO & Invoice Meta)
    const secondRowY = 105;

    // Left Column: BILL TO
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#2F5233').text('BILL TO', 40, secondRowY);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B').text(order.user?.name || 'Valued Customer', 40, secondRowY + 14);

    let addressLines: string[] = [];
    if (order.deliveryAddress) {
      if (typeof order.deliveryAddress === 'string') {
        addressLines = [order.deliveryAddress];
      } else if (typeof order.deliveryAddress === 'object') {
        const addrObj = order.deliveryAddress as any;
        if (addrObj.line1) addressLines.push(addrObj.line1);
        if (addrObj.line2) addressLines.push(addrObj.line2);
        const cityStatePincode = [addrObj.city, addrObj.state, addrObj.pincode].filter(Boolean).join(', ');
        if (cityStatePincode) addressLines.push(cityStatePincode);
      }
    }

    let addrY = secondRowY + 28;
    if (addressLines.length > 0) {
      addressLines.forEach((line) => {
        doc.font('Helvetica').fontSize(9).fillColor('#475569').text(line, 40, addrY, { width: 250 });
        addrY += 12;
      });
    } else {
      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Standard Delivery Address', 40, addrY, { width: 250 });
      addrY += 12;
    }

    if (order.user?.email) {
      doc.font('Helvetica').fontSize(8.5).fillColor('#64748B').text(`Email: ${order.user.email}`, 40, addrY);
      addrY += 11;
    }
    if (order.user?.phone) {
      doc.font('Helvetica').fontSize(8.5).fillColor('#64748B').text(`Phone: ${order.user.phone}`, 40, addrY);
      addrY += 11;
    }

    // Right Column: Invoice No & Date
    const invNo = `INV-${order.id.slice(0, 8).toUpperCase()}`;
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    let metaY = secondRowY;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748B').text('Invoice No:', 330, metaY, { width: 90, align: 'left' });
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#1E293B').text(invNo, 420, metaY, { width: 135, align: 'right' });
    metaY += 14;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748B').text('Date:', 330, metaY, { width: 90, align: 'left' });
    doc.font('Helvetica').fontSize(9).fillColor('#1E293B').text(formattedDate, 420, metaY, { width: 135, align: 'right' });
    metaY += 14;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748B').text('Payment Status:', 330, metaY, { width: 90, align: 'left' });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#2F5233').text(String(order.paymentStatus), 420, metaY, { width: 135, align: 'right' });

    // 3. Itemized Table
    const tableTopY = Math.max(addrY + 15, metaY + 25, 195);

    // Table Header Bar (Primary Green Bar)
    doc.rect(40, tableTopY, 515, 22).fill('#2F5233');

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    doc.text('Description', 50, tableTopY + 6, { width: 230, align: 'left' });
    doc.text('Qty', 285, tableTopY + 6, { width: 45, align: 'center' });
    doc.text('Unit Price', 335, tableTopY + 6, { width: 95, align: 'right' });
    doc.text('Total', 435, tableTopY + 6, { width: 110, align: 'right' });

    let rowY = tableTopY + 22;
    let subtotal = 0;

    order.items.forEach((item, index) => {
      const title = item.product?.title || item.course?.title || 'Item';
      const unitPrice = Number(item.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      // Alternating light neutral shading
      if (index % 2 === 1) {
        doc.rect(40, rowY, 515, 22).fill('#F8FAF9');
      }

      doc.font('Helvetica').fontSize(9).fillColor('#1E293B');
      doc.text(title, 50, rowY + 6, { width: 230, align: 'left', lineBreak: false });
      doc.text(String(item.quantity), 285, rowY + 6, { width: 45, align: 'center' });
      doc.text(`₹${unitPrice.toFixed(2)}`, 335, rowY + 6, { width: 95, align: 'right' });
      doc.text(`₹${lineTotal.toFixed(2)}`, 435, rowY + 6, { width: 110, align: 'right' });

      // Row divider stroke
      doc.moveTo(40, rowY + 22).lineTo(555, rowY + 22).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      rowY += 22;
    });

    // 4. Summary Block (Right-aligned below table)
    let summaryY = rowY + 15;
    const grandTotal = Number(order.total);
    const discountAmount = subtotal - grandTotal > 0.01 ? subtotal - grandTotal : 0;

    // Subtotal
    doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Subtotal', 330, summaryY, { width: 110, align: 'left' });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B').text(`₹${subtotal.toFixed(2)}`, 440, summaryY, { width: 115, align: 'right' });
    summaryY += 15;

    // Tax (Show ₹0.00 since platform currently doesn't calculate tax)
    doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Tax', 330, summaryY, { width: 110, align: 'left' });
    doc.font('Helvetica').fontSize(9).fillColor('#1E293B').text('₹0.00', 440, summaryY, { width: 115, align: 'right' });
    summaryY += 15;

    // Discount (Only shown if real discount exists)
    if (discountAmount > 0) {
      doc.font('Helvetica').fontSize(9).fillColor('#64748B').text('Discount', 330, summaryY, { width: 110, align: 'left' });
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#16A34A').text(`-₹${discountAmount.toFixed(2)}`, 440, summaryY, { width: 115, align: 'right' });
      summaryY += 15;
    }

    // TOTAL Bar (Solid Primary Green Bar)
    doc.rect(330, summaryY, 225, 26).fill('#2F5233');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF').text('TOTAL', 345, summaryY + 7, { width: 80, align: 'left' });
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF').text(`₹${grandTotal.toFixed(2)}`, 430, summaryY + 7, { width: 115, align: 'right' });

    // 5. Payment Method Line (Left side below table)
    const paymentY = rowY + 15;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B').text('Payment Method:', 40, paymentY);
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(order.paymentMethod || 'Mock Payment', 130, paymentY);

    // 6. Thank You Note (Bottom Footer)
    const footerY = Math.max(summaryY + 45, 740);
    doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#2F5233').text('Thank you for shopping with EcoMarket!', 40, footerY + 12, { align: 'center', width: 515 });
    doc.font('Helvetica').fontSize(8).fillColor('#64748B').text('For support or inquiries, please contact support@ecomarket.com', 40, footerY + 25, { align: 'center', width: 515 });

    doc.end();
  } catch (error) {
    next(error);
  }
};
