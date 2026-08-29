import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';

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

export interface CartItem {
  productId?: string;
  courseId?: string;
  quantity: number;
  type: 'PRODUCT' | 'COURSE';
  itemType?: 'PRODUCT' | 'COURSE';
  title: string;
  price: number;
  image: string;
  category?: string;
  sellerName?: string;
}

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: dbUser.id,
          items: [],
        },
      });
    }

    const rawItems: any[] = (cart.items as any[]) || [];
    const productIds = rawItems.filter((i) => i.productId).map((i) => i.productId);
    const courseIds = rawItems.filter((i) => i.courseId).map((i) => i.courseId);

    const [liveProducts, liveCourses] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { seller: { select: { name: true } } },
      }),
      prisma.course.findMany({
        where: { id: { in: courseIds } },
        include: { educator: { select: { name: true } } },
      }),
    ]);

    const productMap = new Map(liveProducts.map((p) => [p.id, p]));
    const courseMap = new Map(liveCourses.map((c) => [c.id, c]));

    const populatedItems = rawItems.map((item) => {
      if (item.courseId || item.type === 'COURSE') {
        const course = courseMap.get(item.courseId || item.productId);
        if (course) {
          return {
            courseId: course.id,
            productId: course.id, // Fallback for uniform UI key
            quantity: item.quantity,
            type: 'COURSE' as const,
            itemType: 'COURSE' as const,
            title: course.title,
            price: Number(course.price),
            image: course.previewVideo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
            category: course.category,
            sellerName: course.educator?.name || 'Educator',
          };
        }
      } else {
        const prod = productMap.get(item.productId);
        if (prod) {
          return {
            productId: prod.id,
            quantity: item.quantity,
            type: 'PRODUCT' as const,
            itemType: 'PRODUCT' as const,
            title: prod.title,
            price: Number(prod.price),
            image: prod.images?.[0] || 'https://via.placeholder.com/150',
            category: prod.category,
            sellerName: prod.seller?.name || 'Seller',
            stock: prod.stock,
          };
        }
      }
      return item;
    });

    return res.status(200).json({
      success: true,
      data: {
        id: cart.id,
        items: populatedItems,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { productId, courseId, type = 'PRODUCT', itemType, quantity = 1 } = req.body;
    const targetType = (type || itemType || 'PRODUCT').toUpperCase() as 'PRODUCT' | 'COURSE';
    const targetId = courseId || productId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'productId or courseId is required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    let title = '';
    let price = 0;
    let image = '';
    let category = '';
    let sellerName = '';

    if (targetType === 'COURSE') {
      const course = await prisma.course.findUnique({
        where: { id: targetId },
        include: { educator: { select: { name: true } } },
      });
      if (!course) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Course '${targetId}' not found` },
        });
      }
      title = course.title;
      price = Number(course.price);
      image = course.previewVideo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800';
      category = course.category;
      sellerName = course.educator?.name || 'Educator';
    } else {
      const product = await prisma.product.findUnique({
        where: { id: targetId },
        include: { seller: { select: { name: true } } },
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product '${targetId}' not found` },
        });
      }

      if (product.stock < Number(quantity)) {
        return res.status(400).json({
          success: false,
          error: { code: 'OUT_OF_STOCK', message: `Only ${product.stock} units available.` },
        });
      }

      title = product.title;
      price = Number(product.price);
      image = product.images?.[0] || 'https://via.placeholder.com/150';
      category = product.category;
      sellerName = product.seller?.name || 'Seller';
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    let currentItems: any[] = (cart?.items as any[]) || [];
    const existingIndex = currentItems.findIndex(
      (item) => (targetType === 'COURSE' ? item.courseId === targetId : item.productId === targetId)
    );

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += Number(quantity);
    } else {
      currentItems.push({
        ...(targetType === 'COURSE' ? { courseId: targetId } : { productId: targetId }),
        quantity: Number(quantity),
        type: targetType,
        itemType: targetType,
        title,
        price,
        image,
        category,
        sellerName,
      });
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: dbUser.id,
          items: currentItems as any,
        },
      });
    } else {
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { items: currentItems as any },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Added '${title}' to cart`,
      data: {
        id: cart.id,
        items: currentItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const patchCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const productId = req.params.productId as string;
    const { quantity } = req.body;

    const dbUser = await getDbUser(auth.userId);
    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cart not found' },
      });
    }

    let currentItems: any[] = (cart.items as any[]) || [];

    if (Number(quantity) <= 0) {
      currentItems = currentItems.filter(
        (i) => i.productId !== productId && i.courseId !== productId
      );
    } else {
      const idx = currentItems.findIndex(
        (i) => i.productId === productId || i.courseId === productId
      );
      if (idx > -1) {
        currentItems[idx].quantity = Number(quantity);
      }
    }

    cart = await prisma.cart.update({
      where: { id: cart.id },
      data: { items: currentItems as any },
    });

    return res.status(200).json({
      success: true,
      data: {
        id: cart.id,
        items: currentItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  return patchCartItem(req, res, next);
};

export const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const productId = req.params.productId as string;
    const dbUser = await getDbUser(auth.userId);

    let cart = await prisma.cart.findUnique({
      where: { userId: dbUser.id },
    });

    if (cart) {
      const currentItems: any[] = ((cart.items as any[]) || []).filter(
        (i) => i.productId !== productId && i.courseId !== productId
      );

      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { items: currentItems as any },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: cart?.id,
        items: cart ? (cart.items as any) : [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    await prisma.cart.updateMany({
      where: { userId: dbUser.id },
      data: { items: [] },
    });

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};
