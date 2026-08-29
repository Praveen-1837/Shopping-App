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

export interface Seller {
  id: string;
  name: string;
  email: string;
  role: string;
  clerkId: string;
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
  images: string[];
  sustainabilityTags: string[];
  traceabilityStages?: { stage: string; location?: string; date?: string; note?: string }[] | null;
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
