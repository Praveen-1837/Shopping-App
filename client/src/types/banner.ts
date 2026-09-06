export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  ctaText?: string | null;
  ctaLink?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
