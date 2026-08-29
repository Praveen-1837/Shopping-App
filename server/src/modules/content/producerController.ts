import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { z } from 'zod';

async function getDbUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: 'User',
        email: `${clerkId}@example.com`,
        role: Role.CUSTOMER,
      },
    });
  }
  return user;
}

const updateProducerSchema = z.object({
  name: z.string().min(2).optional(),
  location: z.string().min(2).optional(),
  story: z.string().optional(),
  practices: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

// GET /api/v1/producers/:id
export const getProducerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const producer = await prisma.producer.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        products: {
          include: {
            producer: true,
          },
        },
      },
    });

    if (!producer) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCER_NOT_FOUND', message: 'Producer profile not found' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: producer,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/producers/:id
export const updateProducerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const id = req.params.id as string;

    const existingProducer = await prisma.producer.findUnique({ where: { id } });
    if (!existingProducer) {
      res.status(404).json({
        success: false,
        error: { code: 'PRODUCER_NOT_FOUND', message: 'Producer profile not found' },
      });
      return;
    }

    // Ownership check: user must own producer record or be ADMIN
    if (existingProducer.userId !== dbUser.id && dbUser.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not authorized to update this producer profile' },
      });
      return;
    }

    const validatedData = updateProducerSchema.parse(req.body);

    const updatedProducer = await prisma.producer.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({
      success: true,
      data: updatedProducer,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/products/:id/traceability
export const updateProductTraceability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const id = req.params.id as string;
    const { traceabilityStages } = req.body;

    if (!Array.isArray(traceabilityStages)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'traceabilityStages must be an array' },
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

    // Ownership check: seller must own product or be ADMIN
    if (product.sellerId !== dbUser.id && dbUser.role !== Role.ADMIN) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to update this product' },
      });
      return;
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { traceabilityStages },
    });

    res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};
