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
        usageContent: validatedData.usageContent ? (validatedData.usageContent as any) : undefined,
        ingredients: validatedData.ingredients || null,
        usageDirections: validatedData.usageDirections || null,
        safetyInfo: validatedData.safetyInfo || null,
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
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clerkId: true,
            sellerProfile: true,
            producer: true,
          },
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

    if (product.status === 'INACTIVE') {
      const auth = getAuth(req);
      let isOwnerOrAdmin = false;
      if (auth && auth.userId) {
        const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
        if (user && (user.id === product.sellerId || user.role === Role.ADMIN)) {
          isOwnerOrAdmin = true;
        }
      }
      if (!isOwnerOrAdmin) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Product with ID '${id}' is currently unavailable` },
        });
      }
    }

    // 1. Calculate Real 30-Day Sales Count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesAgg = await prisma.orderItem.aggregate({
      where: {
        productId: id,
        order: {
          paymentStatus: 'SUCCESS',
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: { quantity: true },
    });
    const monthlySalesCount = salesAgg._sum.quantity || 0;

    // 2. Fetch Site Settings for Delivery Estimate & Legal Disclaimer
    const siteSettings = await prisma.siteSettings.findFirst();
    const estimatedDeliveryDays = siteSettings?.estimatedDeliveryDays || '5-7 business days';
    const legalDisclaimerText = (siteSettings as any)?.legalDisclaimerText || 'Product information is provided by individual sellers and producers on this platform. Please review packaging and product details carefully before use. For food items, always check for allergens and storage instructions. This platform does not independently verify seller-provided claims.';

    // 3. Find 3-4 Similar Items in the Same Category
    const similarProducts = await prisma.product.findMany({
      where: {
        id: { not: id },
        category: { equals: product.category, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      take: 4,
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        category: true,
        sustainabilityTags: true,
      },
    });

    // 4. Fetch User Default Address if authenticated
    let userDefaultAddress = null;
    const auth = getAuth(req);
    if (auth && auth.userId) {
      const dbUser = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
      if (dbUser) {
        const address = await prisma.address.findFirst({
          where: { userId: dbUser.id, isDefault: true },
        });
        if (address) {
          userDefaultAddress = { city: address.city, pincode: address.pincode, label: address.label };
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        monthlySalesCount,
        estimatedDeliveryDays,
        legalDisclaimerText,
        userDefaultAddress,
        similarProducts,
      },
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
    const { producerData, ...updatePayload } = validatedData;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updatePayload as any,
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

export const getCategoryPreviews = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const defaultCategoryImages: Record<string, string> = {
      'Food & Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
      'Artisan Crafts': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
      'Eco Living': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=800',
      'Organic Produce': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800',
    };

    let categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    if (categories.length === 0) {
      const defaults = Object.keys(defaultCategoryImages);
      for (const name of defaults) {
        await prisma.category.create({
          data: { name, imageUrl: defaultCategoryImages[name] },
        });
      }
      categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    }

    const targetCategories = ['Artisan Crafts', 'Eco Living', 'Food & Spices', 'Organic Produce'];

    const previews = await Promise.all(
      targetCategories.map(async (catName) => {
        const dbCat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        const imageUrl = dbCat?.imageUrl || defaultCategoryImages[catName] || null;

        const products = await prisma.product.findMany({
          where: {
            status: 'ACTIVE',
            category: { equals: catName, mode: 'insensitive' },
          },
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, images: true },
        });

        const items = products
          .map((p) => ({
            id: p.id,
            title: p.title,
            image: p.images[0] || '',
          }))
          .filter((i) => i.image);

        return {
          category: catName,
          imageUrl,
          items,
          linkType: 'category' as const,
          linkValue: catName,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: previews,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id/reviews
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total, ratingGroups, ratingAgg, product] = await Promise.all([
      prisma.review.findMany({
        where: { productId: id },
        skip,
        take: limit,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { productId: id } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { productId: id },
        _count: { rating: true },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        where: { productId: id },
      }),
      prisma.product.findUnique({
        where: { id },
        select: { id: true, reviewSentimentSummary: true },
      }),
    ]);

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingGroups.forEach((g) => {
      if (g.rating >= 1 && g.rating <= 5) {
        breakdown[g.rating] = g._count.rating;
      }
    });

    const averageRating = ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : 0;

    // Fetch all customer photos attached to reviews for this product
    const allReviewsWithPhotos = await prisma.review.findMany({
      where: { productId: id, photos: { isEmpty: false } },
      select: { photos: true },
    });
    const customerPhotos = allReviewsWithPhotos.flatMap((r) => r.photos).filter(Boolean);

    // AI Cached Review Sentiment Analysis (Only if >= 5 reviews and not already cached)
    let sentimentSummary = product?.reviewSentimentSummary as { themes: string[]; updatedAt: string } | null;

    if (total >= 5 && !sentimentSummary) {
      const allComments = await prisma.review.findMany({
        where: { productId: id },
        select: { comment: true },
      });
      const combinedText = allComments.map((c) => c.comment || '').join(' ').toLowerCase();

      const candidateThemes = [
        { name: 'Quality', sentiment: 'positive', keywords: ['quality', 'premium', 'high grade', 'great', 'excellent', 'durable'] },
        { name: 'Freshness', sentiment: 'positive', keywords: ['fresh', 'crisp', 'taste', 'aroma', 'flavor', 'pure'] },
        { name: 'Packaging', sentiment: 'positive', keywords: ['pack', 'packaging', 'box', 'seal', 'wrapped', 'safe'] },
        { name: 'Value', sentiment: 'positive', keywords: ['price', 'worth', 'value', 'affordable', 'cost'] },
        { name: 'Craftsmanship', sentiment: 'positive', keywords: ['handcrafted', 'artisan', 'craft', 'detail', 'finish'] },
        { name: 'Fast Delivery', sentiment: 'positive', keywords: ['fast', 'quick', 'shipping', 'delivery', 'arrived'] },
        { name: 'Staining', sentiment: 'negative', keywords: ['stain', 'color leak', 'marks'] },
        { name: 'Fragile', sentiment: 'negative', keywords: ['fragile', 'broken', 'damaged', 'crack'] },
      ];

      const detected = candidateThemes
        .filter((theme) => theme.keywords.some((kw) => combinedText.includes(kw)))
        .map((t) => ({ name: t.name, sentiment: t.sentiment }));

      const finalThemes = detected.length > 0 ? detected : [
        { name: 'Quality', sentiment: 'positive' },
        { name: 'Freshness', sentiment: 'positive' },
        { name: 'Packaging', sentiment: 'positive' },
      ];

      sentimentSummary = {
        themes: finalThemes as any,
        updatedAt: new Date().toISOString(),
      };

      await prisma.product.update({
        where: { id },
        data: { reviewSentimentSummary: sentimentSummary as any },
      });
    }

    return res.status(200).json({
      success: true,
      data: reviews,
      summary: {
        averageRating,
        totalReviews: total,
        breakdown,
        customerPhotos,
        sentimentThemes: total >= 5 ? (sentimentSummary?.themes || []) : [],
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products/:id/reviews
export const addProductReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const productId = req.params.id as string;
    const { rating, comment, photos } = req.body;

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Rating must be an integer between 1 and 5' },
      });
    }

    const dbUser = await getDbUser(auth.userId);

    const review = await prisma.review.create({
      data: {
        userId: dbUser.id,
        productId,
        rating: Number(rating),
        comment: comment || '',
        photos: Array.isArray(photos) ? photos : [],
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};
