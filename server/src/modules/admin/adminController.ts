import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { OrderStatus } from '@prisma/client';

// GET /api/v1/admin/stats
export const getAdminStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const revenueResult = await prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'SUCCESS' },
    });

    const totalRevenue = Number(revenueResult._sum.total || 0);
    const totalOrders = await prisma.order.count();
    const totalProducts = await prisma.product.count();
    const totalUsers = await prisma.user.count();

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/categories
export const getAdminCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      const defaults = ['Food & Spices', 'Artisan Crafts', 'Eco Living', 'Organic Produce'];
      await prisma.category.createMany({
        data: defaults.map((name) => ({ name })),
        skipDuplicates: true,
      });
      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
    }

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/categories
export const createAdminCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Category name is required' },
      });
      return;
    }

    const cleanName = name.trim();

    const existing = await prisma.category.findUnique({
      where: { name: cleanName },
    });

    if (existing) {
      res.status(400).json({
        success: false,
        error: { code: 'CATEGORY_EXISTS', message: 'A category with this name already exists' },
      });
      return;
    }

    const category = await prisma.category.create({
      data: { name: cleanName },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/categories/:id
export const updateAdminCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_NAME', message: 'Category name is required' },
      });
      return;
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/admin/categories/:id
export const deleteAdminCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/users
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          clerkId: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        items: users,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/users/:id/block
export const toggleUserBlockStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isBlocked } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const newBlockedState = typeof isBlocked === 'boolean' ? isBlocked : !user.isBlocked;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked: newBlockedState },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `User account has been ${newBlockedState ? 'blocked' : 'unblocked'}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/orders
export const getAdminOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { title: true, images: true } },
              course: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        items: orders,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/orders/:id
export const getAdminOrderDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, title: true, images: true, price: true } },
            course: { select: { id: true, title: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/orders/:id/status
export const updateAdminOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || typeof status !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Order status is required' },
      });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/products
export const getAdminProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const status = (req.query.status as string)?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'All Categories') {
      where.category = category;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          seller: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        items: products,
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/products/:id/status
export const updateAdminProductStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be ACTIVE or INACTIVE' },
      });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `Product status set to ${status}`,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/admin/products/:id
export const deleteAdminProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
      });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Product deleted permanently',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/settings
export const getAdminSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          storeName: 'EcoMarket',
          contactEmail: 'support@ecomarket.com',
          currencySymbol: '₹',
          flatShippingFee: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/settings
export const updateAdminSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeName, contactEmail, currencySymbol, flatShippingFee } = req.body;

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          storeName: storeName || 'EcoMarket',
          contactEmail: contactEmail || 'support@ecomarket.com',
          currencySymbol: currencySymbol || '₹',
          flatShippingFee: flatShippingFee !== undefined ? Number(flatShippingFee) : 0,
        },
      });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          ...(storeName !== undefined && { storeName: String(storeName).trim() }),
          ...(contactEmail !== undefined && { contactEmail: String(contactEmail).trim() }),
          ...(currencySymbol !== undefined && { currencySymbol: String(currencySymbol).trim() }),
          ...(flatShippingFee !== undefined && { flatShippingFee: Number(flatShippingFee) }),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Site settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
