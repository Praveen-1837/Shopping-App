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

export async function getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const user = await getDbUser(auth.userId);

    const items = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            producer: true,
          },
        },
        course: {
          include: {
            educator: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: { items },
    });
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { productId, courseId } = req.body;

    if (!productId && !courseId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Either productId or courseId must be provided' },
      });
      return;
    }

    const user = await getDbUser(auth.userId);

    // Idempotent check
    const existing = await prisma.wishlist.findFirst({
      where: {
        userId: user.id,
        ...(productId ? { productId: String(productId) } : { courseId: String(courseId) }),
      },
    });

    if (existing) {
      res.status(200).json({
        success: true,
        data: existing,
        message: 'Item already saved in wishlist',
      });
      return;
    }

    const newItem = await prisma.wishlist.create({
      data: {
        userId: user.id,
        productId: productId ? String(productId) : null,
        courseId: courseId ? String(courseId) : null,
        itemType: productId ? 'PRODUCT' : 'COURSE',
      },
      include: {
        product: true,
        course: true,
      },
    });

    res.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const id = req.params.id as string;
    const user = await getDbUser(auth.userId);

    const wishlistEntry = await prisma.wishlist.findUnique({
      where: { id },
    });

    if (!wishlistEntry) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Wishlist item not found.' },
      });
      return;
    }

    // Strict ownership verification
    if (wishlistEntry.userId !== user.id) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Forbidden: You do not own this wishlist entry.' },
      });
      return;
    }

    await prisma.wishlist.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist successfully',
    });
  } catch (error) {
    next(error);
  }
}
