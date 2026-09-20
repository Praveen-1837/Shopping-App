import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { ProductsResponse } from '../types/product';
import ProductCard from '../components/ProductCard';
import {
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  Sprout,
  ArrowRight,
} from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';
import { Navigate, useNavigate } from 'react-router-dom';
import HeroBannerCarousel from '../components/HeroBannerCarousel';

export default function Home() {
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  // Fetch featured products for homepage preview
  const { data, isLoading, isError, error, refetch } = useQuery<ProductsResponse>({
    queryKey: ['featured-home-products'],
    queryFn: async () => {
      const res = await apiClient.get<ProductsResponse>('/products', {
        params: { page: 1, limit: 8 },
      });
      return res.data;
    },
    enabled: !isAdmin,
  });

  // Fetch 4 quadrant category previews replaced by static categories

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const products = data?.data || [];

  const handleSelectCategory = (cat: string, role?: string) => {
    if (role) {
      navigate(`/shop?producerRole=${encodeURIComponent(role)}`);
    } else if (cat && cat !== 'All Categories') {
      navigate(`/shop/category/${encodeURIComponent(cat)}`);
    } else {
      navigate('/shop');
    }
  };

  const categories = [
    { 
      name: 'Artisan Crafts', 
      image: 'https://res.cloudinary.com/hzjhhalf/image/upload/f_auto,q_auto/Gemini_Generated_Image_removebg-art',
      count: 24 
    },
    { 
      name: 'Eco Living', 
      image: 'https://res.cloudinary.com/hzjhhalf/image/upload/f_auto,q_auto/Gemini_Generated_Image_removebg-eco',
      count: 38 
    },
    { 
      name: 'Food & Spices', 
      image: 'https://res.cloudinary.com/hzjhhalf/image/upload/f_auto,q_auto/Gemini_Generated_Image_removebg-food',
      count: 52 
    },
    { 
      name: 'Organic Produce', 
      image: 'https://res.cloudinary.com/hzjhhalf/image/upload/f_auto,q_auto/Gemini_Generated_Image_removebg-Organic',
      count: 47 
    },
  ];

  return (
    <div className="max-w-[1480px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Intro Header & Brand Messaging */}
      <div className="space-y-1.5 pt-1">
        <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
          <Sprout className="w-3.5 h-3.5 text-primary" />
          <span>Verifiable Eco Marketplace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary tracking-tight">
          Direct From Local Farmers & Eco-Artisans
        </h1>
        <p className="text-sm sm:text-base text-text-muted max-w-2xl font-medium leading-relaxed">
          Ethically harvested organic produce, natural wellness products, and verified sustainability.
        </p>
      </div>

      {/* Unified Hero Carousel + Quadrant Grid Section */}
      <section
        aria-label="Promotional Showcase and Eco Collections"
        className="relative w-full bg-[#FAF7F2] rounded-2xl sm:rounded-3xl border border-text-muted/15 shadow-sm overflow-hidden"
      >
        {/* Promotional Hero Carousel */}
        <HeroBannerCarousel />

        {/* Category Quadrants Grid - Sitting directly inside the fade zone with zero dead space */}
        <div className="relative z-20 mt-4 sm:mt-6 px-3 sm:px-6 pb-6 sm:pb-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-text-primary tracking-tight bg-[#FAF7F2]/90 backdrop-blur-xs px-3 py-1 rounded-xl">
              Explore Eco Collections
            </h2>
            <button
              onClick={() => navigate('/shop')}
              className="text-sm font-bold text-primary hover:text-primary-hover flex items-center space-x-1 cursor-pointer bg-[#FAF7F2]/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Responsive Grid Layout */}
          <div className="relative">
            {/* CATEGORY GRID - 2x2 on all screen sizes */}
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleSelectCategory(cat.name)}
                  className="flex flex-col items-center bg-white rounded-xl py-3 px-1 shadow-sm border border-gray-100 hover:border-[#52b788] transition-colors cursor-pointer"
                >
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    loading="lazy"
                    className="w-12 h-12 object-cover rounded-lg mb-2"
                  />
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
                  <span className="text-[9px] text-gray-400">{cat.count} items</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <div className="space-y-4 pt-6 border-t border-text-muted/15">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-extrabold text-text-primary tracking-tight">
              Featured Eco Discoveries
            </h2>
            <p className="text-sm text-text-muted">Top rated sustainable goods direct from certified producers</p>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-sm font-bold text-primary hover:text-primary-hover flex items-center space-x-1 cursor-pointer"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-text-secondary space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-base font-medium">Loading featured discoveries...</p>
          </div>
        ) : isError ? (
          <div className="bg-error-light border border-error/30 rounded-2xl p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto text-error" />
            <h3 className="text-base font-bold text-error font-heading">Failed to Load Featured Products</h3>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 bg-error text-white text-sm font-semibold rounded-lg hover:bg-error/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-background-card rounded-2xl p-8 text-center border border-text-muted/15 space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-text-muted opacity-50" />
            <h3 className="text-base font-bold font-heading">No Featured Products</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
