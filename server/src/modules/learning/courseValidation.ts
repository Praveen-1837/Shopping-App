import { z } from 'zod';

export const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Module title must be at least 2 characters'),
  videoUrl: z.string().min(5, 'Valid video URL is required'),
  order: z.number().int().default(1),
});

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  durationMins: z.number().int().positive('Duration must be a positive number of minutes'),
  category: z.string().optional().default('Sustainable Agriculture'),
  previewVideo: z.string().optional(),
  certificate: z.boolean().optional().default(true),
  modules: z.array(moduleSchema).min(1, 'Course must contain at least one learning module'),
});

export const updateCourseSchema = createCourseSchema.partial();
