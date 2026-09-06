import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  category: z.string().min(2, 'Category is required'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(10),
  lowStockThreshold: z.coerce.number().int().min(1).default(5),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image URL is required'),
  videoUrl: z.string().url('Video must be a valid URL').optional().or(z.literal('')),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  sustainabilityTags: z.array(z.string()).default([]),
  usageContent: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      steps: z.array(z.string()).optional(),
    })
    .nullable()
    .optional(),
  ingredients: z.string().optional().nullable(),
  usageDirections: z.string().optional().nullable(),
  safetyInfo: z.string().optional().nullable(),
  producerId: z.string().optional(),
  producerData: z
    .object({
      name: z.string().min(2),
      location: z.string().min(2),
      story: z.string().optional(),
      practices: z.string().optional(),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().optional(),
  sellerId: z.string().optional(),
  producerRole: z.string().optional(),
});
