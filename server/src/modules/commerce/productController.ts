import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { createProductSchema, updateProductSchema, productQuerySchema } from './productValidation';
import { Role } from '@prisma/client';

// Helper to get or create DB user from Clerk auth
async function getDbUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: 'Seller User',
        email: `${clerkId}@example.com`,
        role: Role.SELLER,
      },
    });
  }
  return user;
}

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const validatedData = createProductSchema.parse(req.body);
    const dbUser = await getDbUser(auth.userId);

    let producerId = validatedData.producerId;

    // Lightweight producer linkage for FARMER or ARTISAN role
    if (
      (!producerId && validatedData.producerData) ||
      (dbUser.role === Role.FARMER || dbUser.role === Role.ARTISAN)
    ) {
      let producer = await prisma.producer.findUnique({
        where: { userId: dbUser.id },
      });

      if (!producer && validatedData.producerData) {
        producer = await prisma.producer.create({
          data: {
            userId: dbUser.id,
            name: validatedData.producerData.name || dbUser.name,
            location: validatedData.producerData.location || 'Local Community',
            story: validatedData.producerData.story,
            practices: validatedData.producerData.practices,
          },
        });
      }

      if (producer) {
        producerId = producer.id;
      }
    }

    const product = await prisma.product.create({
      data: {
        sellerId: dbUser.id,
        producerId: producerId || null,
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        category: validatedData.category,
        stock: validatedData.stock,
        lowStockThreshold: validatedData.lowStockThreshold || 5,
        images: validatedData.images,
        videoUrl: validatedData.videoUrl || null,
        seoTitle: validatedData.seoTitle || null,
        seoDescription: validatedData.seoDescription || null,
        sustainabilityTags: validatedData.sustainabilityTags,
      },
      include: {
        seller: {
          select: { id: true, name: true, email: true, role: true, clerkId: true },
        },
        producer: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = productQuerySchema.parse(req.query);

    const where: any = {};

    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.sellerId) {
      where.sellerId = query.sellerId;
    } else {
      where.status = 'ACTIVE';
    }

    if (query.producerRole) {
      where.seller = { role: query.producerRole as Role };
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: { id: true, name: true, email: true, role: true, clerkId: true },
          },
          producer: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, email: true, role: true, clerkId: true },
        },
        producer: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found` },
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found` },
      });
    }

    // Ownership check: seller.clerkId === req.auth.userId OR ADMIN role
    const dbUser = await getDbUser(auth.userId);
    const isOwner = existingProduct.seller.clerkId === auth.userId || dbUser.id === existingProduct.sellerId;
    const isAdmin = dbUser.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to edit this product' },
      });
    }

    const validatedData = updateProductSchema.parse(req.body);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: validatedData,
      include: {
        seller: {
          select: { id: true, name: true, email: true, role: true, clerkId: true },
        },
        producer: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const id = req.params.id as string;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found` },
      });
    }

    // Ownership check: seller.clerkId === req.auth.userId OR ADMIN role
    const dbUser = await getDbUser(auth.userId);
    const isOwner = existingProduct.seller.clerkId === auth.userId || dbUser.id === existingProduct.sellerId;
    const isAdmin = dbUser.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to delete this product' },
      });
    }

    await prisma.product.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: `Product '${existingProduct.title}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
