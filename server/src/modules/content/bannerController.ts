import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

// Public: GET /api/v1/banners
export const getActiveBanners = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.promoBanner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: GET /api/v1/admin/banners
export const getAllBanners = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banners = await prisma.promoBanner.findMany({
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: POST /api/v1/admin/banners
export const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, subtitle, imageUrl, ctaText, ctaLink, order, isActive } = req.body;

    if (!title || !imageUrl) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Title and imageUrl are required' },
      });
      return;
    }

    let bannerOrder = order;
    if (bannerOrder === undefined || bannerOrder === null) {
      const maxBanner = await prisma.promoBanner.findFirst({
        orderBy: { order: 'desc' },
      });
      bannerOrder = maxBanner ? maxBanner.order + 1 : 0;
    }

    const banner = await prisma.promoBanner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : null,
        imageUrl: imageUrl.trim(),
        ctaText: ctaText ? ctaText.trim() : null,
        ctaLink: ctaLink ? ctaLink.trim() : null,
        order: Number(bannerOrder),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: PUT /api/v1/admin/banners/:id
export const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, subtitle, imageUrl, ctaText, ctaLink, order, isActive } = req.body;

    const existing = await prisma.promoBanner.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Banner not found' },
      });
      return;
    }

    const banner = await prisma.promoBanner.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle ? subtitle.trim() : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl.trim() }),
        ...(ctaText !== undefined && { ctaText: ctaText ? ctaText.trim() : null }),
        ...(ctaLink !== undefined && { ctaLink: ctaLink ? ctaLink.trim() : null }),
        ...(order !== undefined && { order: Number(order) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: DELETE /api/v1/admin/banners/:id
export const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.promoBanner.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Banner not found' },
      });
      return;
    }

    await prisma.promoBanner.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Admin: PATCH /api/v1/admin/banners/:id/toggle
export const toggleBannerActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.promoBanner.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Banner not found' },
      });
      return;
    }

    const banner = await prisma.promoBanner.update({
      where: { id },
      data: {
        isActive: !existing.isActive,
      },
    });

    res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};
