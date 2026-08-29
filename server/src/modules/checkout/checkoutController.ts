import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

async function getDbUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: 'Customer User',
        email: `${clerkId}@example.com`,
        role: Role.CUSTOMER,
      },
    });
  }
  return user;
}

export const createCheckoutOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { deliveryAddress } = req.body;
    const dbUser = await getDbUser(auth.userId);

    // Read user cart strictly server-side
    const cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    const items: any[] = (cart?.items as any[]) || [];

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CART', message: 'Your cart is empty. Add items before checking out.' },
      });
    }

    const productIds = items.filter((i) => i.productId && (i.type === 'PRODUCT' || !i.type)).map((i) => i.productId);
    const courseIds = items.filter((i) => i.courseId || i.type === 'COURSE').map((i) => i.courseId || i.productId);

    const [liveProducts, liveCourses] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      prisma.course.findMany({ where: { id: { in: courseIds } } }),
    ]);

    const productMap = new Map(liveProducts.map((p) => [p.id, p]));
    const courseMap = new Map(liveCourses.map((c) => [c.id, c]));

    let subtotal = 0;
    const orderItemData: any[] = [];

    for (const item of items) {
      if (item.type === 'COURSE' || item.courseId) {
        const cId = item.courseId || item.productId;
        const course = courseMap.get(cId);
        if (!course) {
          return res.status(400).json({
            success: false,
            error: { code: 'COURSE_UNAVAILABLE', message: `Course '${cId}' is no longer available.` },
          });
        }
        const itemPrice = Number(course.price);
        subtotal += itemPrice * item.quantity;
        orderItemData.push({
          courseId: course.id,
          quantity: item.quantity,
          price: itemPrice,
          itemType: 'COURSE',
        });
      } else {
        const prod = productMap.get(item.productId);
        if (!prod) {
          return res.status(400).json({
            success: false,
            error: { code: 'PRODUCT_UNAVAILABLE', message: `Product '${item.productId}' is no longer available.` },
          });
        }
        const itemPrice = Number(prod.price);
        subtotal += itemPrice * item.quantity;
        orderItemData.push({
          productId: prod.id,
          quantity: item.quantity,
          price: itemPrice,
          itemType: 'PRODUCT',
        });
      }
    }

    const siteSettings = await prisma.siteSettings.findFirst();
    const flatFee = siteSettings ? Number(siteSettings.flatShippingFee) : 0;
    const shipping = flatFee > 0 ? flatFee : (subtotal > 1000 ? 0 : 70);
    const totalAmount = subtotal + shipping;

    // Create Order with PENDING status and PENDING paymentStatus
    const order = await prisma.order.create({
      data: {
        userId: dbUser.id,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        total: totalAmount,
        deliveryAddress: deliveryAddress || {
          recipientName: dbUser.name,
          streetAddress: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          phone: dbUser.phone || '+919876543210',
        },
        items: {
          create: orderItemData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            course: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Order created with PENDING status. Proceed to payment process.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    const orders = await prisma.order.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
            course: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;
    const dbUser = await getDbUser(auth.userId);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                producer: true,
              },
            },
            course: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Order '${id}' not found` },
      });
    }

    if (order.userId !== dbUser.id && dbUser.role !== Role.ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to view this order' },
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
