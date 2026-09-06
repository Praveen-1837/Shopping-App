export interface Producer {
  id: string;
  userId: string;
  name: string;
  location: string;
  story?: string;
  practices?: string;
  photos?: string[];
  createdAt: string;
}

export interface SellerProfile {
  id?: string;
  bio?: string;
  logoUrl?: string;
  bannerUrl?: string;
  badges?: string[];
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  role: string;
  clerkId: string;
  sellerProfile?: SellerProfile | null;
  producer?: Producer | null;
}

export interface UsageContent {
  title?: string;
  description?: string;
  steps?: string[];
}

export interface SentimentThemeItem {
  name: string;
  sentiment?: 'positive' | 'negative';
}

export interface ReviewSentimentSummary {
  themes?: (string | SentimentThemeItem)[];
  updatedAt?: string;
}

export interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  sustainabilityTags: string[];
}

export interface Product {
  id: string;
  sellerId: string;
  seller: Seller;
  producerId?: string | null;
  producer?: Producer | null;
  title: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  lowStockThreshold?: number;
  status?: string;
  images: string[];
  sustainabilityTags: string[];
  traceabilityStages?: { stage: string; location?: string; date?: string; note?: string }[] | null;
  usageContent?: UsageContent | null;
  reviewSentimentSummary?: ReviewSentimentSummary | null;
  ingredients?: string | null;
  usageDirections?: string | null;
  safetyInfo?: string | null;
  legalDisclaimerText?: string;
  monthlySalesCount?: number;
  estimatedDeliveryDays?: string;
  userDefaultAddress?: { city: string; pincode: string; label: string } | null;
  similarProducts?: SimilarProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
