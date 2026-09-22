import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';

async function getDbUser(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error('User not found');
  return user;
}

export const getSellerProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const seller = await getDbUser(auth.userId);
    const sellerId = seller.id;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const total = await prisma.product.count({
      where: { sellerId }
    });

    const products = await prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        images: true,
        videoUrl: true,
        stock: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const formattedProducts = products.map(p => ({
      id: p.id,
      name: p.title,
      description: p.description,
      price: Number(p.price),
      category: p.category,
      image: p.images[0] || null,
      videoUrl: p.videoUrl,
      quantity: p.stock,
      isActive: p.status === 'ACTIVE',
      sku: p.id.substring(0, 8).toUpperCase(), // mock SKU since it's not in DB
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    const pages = Math.ceil(total / limit);

    res.status(200).json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasMore: page < pages
      }
    });
  } catch (error: any) {
    console.error('[getSellerProducts Error]', error);
    next(error);
  }
};

export const deleteSellerProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    const seller = await getDbUser(auth.userId);
    const productId = req.params.id;

    // Verify ownership
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      res.status(404).json({ error: 'Not Found', message: 'Product not found' });
      return;
    }

    if (product.sellerId !== seller.id) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own products' });
      return;
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('[deleteSellerProduct Error]', error);
    next(error);
  }
};
