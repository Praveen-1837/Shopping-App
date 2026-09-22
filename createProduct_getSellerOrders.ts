import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { OrderStatus } from '@prisma/client';

async function getDbUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    throw new Error('Authenticated user not found');
  }
  return user;
}

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to create product'
      });
      return;
    }

    const seller = await getDbUser(auth.userId);
    const sellerId = seller.id;

    const { name, description, price, category, image, quantity, isActive } = req.body;

    if (!name || !price || !category) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Required fields: name, price, category',
        missing: [
          !name && 'name',
          !price && 'price',
          !category && 'category'
        ].filter(Boolean)
      });
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Price must be a positive number'
      });
      return;
    }

    const newProduct = await prisma.product.create({
      data: {
        title: name.trim(),
        description: description?.trim() || '',
        price: priceNum,
        category,
        images: image ? [image] : [],
        stock: quantity ? Number(quantity) : 0,
        status: isActive !== false ? 'ACTIVE' : 'INACTIVE',
        sellerId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`[Product Created] seller=${sellerId}, product=${newProduct.id}, title=${newProduct.title}`);

    res.status(201).json({
      id: newProduct.id,
      sellerId: newProduct.sellerId,
      name: newProduct.title,
      description: newProduct.description,
      price: Number(newProduct.price),
      category: newProduct.category,
      image: newProduct.images[0] || null,
      quantity: newProduct.stock,
      isActive: newProduct.status === 'ACTIVE',
      createdAt: newProduct.createdAt,
      updatedAt: newProduct.updatedAt
    });
  } catch (error: any) {
    console.error('[createProduct Error]', error);
    next(error);
  }
};

export const getSellerOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to view orders'
      });
      return;
    }

    const seller = await getDbUser(auth.userId);
    const sellerId = seller.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const statusQuery = req.query.status ? String(req.query.status).toUpperCase() : undefined;
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortOrder = req.query.sortOrder === 'ASC' ? 'asc' : 'desc';

    const whereClause: any = {
      items: {
        some: {
          product: {
            sellerId: sellerId
          }
        }
      }
    };

    if (statusQuery && ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].includes(statusQuery)) {
      whereClause.status = statusQuery as OrderStatus;
    }

    const totalOrders = await prisma.order.count({ where: whereClause });

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          where: {
            product: {
              sellerId: sellerId
            }
          },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    });

    const formattedOrders = orders.map(order => {
      const deliveryAddress = order.deliveryAddress as any;
      return {
        id: order.id,
        orderNumber: `ORD-${order.id.substring(0, 8).toUpperCase()}`,
        customerId: order.userId,
        customerName: order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : 'Unknown',
        customerEmail: order.user?.email,
        customerPhone: order.user?.phone,
        totalAmount: Number(order.total),
        status: order.status,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.title || 'Unknown Product',
          productImage: item.product?.images?.[0] || null,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.price) * item.quantity
        })),
        shippingAddress: deliveryAddress ? `${deliveryAddress.line1} ${deliveryAddress.line2 || ''}`.trim() : null,
        shippingCity: deliveryAddress?.city || null,
        shippingState: deliveryAddress?.state || null,
        shippingZip: deliveryAddress?.pincode || null,
        deliveryDate: order.deliveredAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(200).json({
      orders: formattedOrders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        pages: totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error: any) {
    console.error('[getSellerOrders Error]', error);
    next(error);
  }
};
