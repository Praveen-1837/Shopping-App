import { useState, useEffect, useRef } from 'react';
import { optimizeCloudinaryUrl } from "../utils/formatters";
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Product } from '../types/product';
import ProducerBadge from './ProducerBadge';
import { Leaf, ShoppingCart, Check, Star, Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [added, setAdded] = useState<boolean>(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (images.length > 1 && isVisible && !isHovered) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [images.length, isVisible, isHovered]);

  // Wishlist Query & State
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!isSignedIn) return { data: { items: [] } };
      const token = await getToken();
      const res = await apiClient.get('/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!isSignedIn,
  });

  const wishlistItems: any[] = wishlistData?.data?.items || [];
  const wishlistItem = wishlistItems.find((w) => w.productId === product.id);
  const isWishlisted = !!wishlistItem;

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      if (isWishlisted && wishlistItem) {
        await apiClient.delete(`/wishlist/${wishlistItem.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await apiClient.post(
          '/wishlist',
          { productId: product.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        '/cart/items',
        { productId: product.id, quantity: 1, itemType: 'PRODUCT' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setAdded(false), 2000);
    },
  });

  return (
    <div className="bg-background-card rounded-xl sm:rounded-2xl border border-text-muted/15 overflow-hidden shadow-sm hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group relative">
      <div>
        {/* Product Image Container */}
        <div 
          ref={containerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative aspect-square sm:aspect-[4/3] bg-background-muted overflow-hidden"
        >
          <Link to={`/product/${product.id}`}>
            <img
              src={optimizeCloudinaryUrl(images[currentImageIndex], 600, 600)}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>

          {/* Carousel Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? 'bg-white scale-125 shadow-sm' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Category Pill */}
          <div className="absolute top-2 left-2 bg-background-card/90 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-semibold text-primary border border-text-muted/10 shadow-xs max-w-[70%] truncate">
            {product.category}
          </div>

          {/* Wishlist Toggle Button */}
          <button
            onClick={() => toggleWishlistMutation.mutate()}
            disabled={toggleWishlistMutation.isPending}
            aria-label="Save to wishlist"
            className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs cursor-pointer ${
              isWishlisted
                ? 'bg-secondary text-white scale-110'
                : 'bg-background-card/80 text-text-muted hover:text-secondary hover:bg-background-card'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Details */}
        <div className="p-2 sm:p-3 space-y-1 sm:space-y-1.5">
          {/* Linked Producer Badge */}
          {product.producer && (
            <div className="text-[10px] sm:text-[11px]">
              <ProducerBadge producer={product.producer} />
            </div>
          )}

          {/* Title */}
          <h3 className="font-heading font-bold text-[11px] sm:text-base text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            <Link to={`/product/${product.id}`}>{product.title}</Link>
          </h3>

          {/* Star Rating Badge */}
          <div className="flex items-center space-x-1 text-[10px] sm:text-[11px] text-text-secondary">
            <div className="flex items-center text-amber-500">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current opacity-40" />
            </div>
            <span className="font-semibold text-text-primary">4.8</span>
            <span className="text-[9px] sm:text-[10px] text-text-muted">(124)</span>
          </div>

          {/* Sustainability Tags Badges */}
          {product.sustainabilityTags?.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {product.sustainabilityTags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-0.5 bg-primary-light text-primary text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
                >
                  <Leaf className="w-2 sm:w-2.5 h-2 sm:h-2.5 shrink-0" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price & Quick Add Action Footer */}
      <div className="p-2 sm:p-3 pt-1.5 sm:pt-2 flex items-center justify-between border-t border-text-muted/10 mt-0.5 bg-background-muted/30">
        <div className="flex flex-col">
          <span className="text-[9px] sm:hidden text-text-muted block uppercase tracking-wider font-semibold leading-none">Price</span>
          <div className="flex items-baseline space-x-1 sm:space-x-1.5 mt-0.5 sm:mt-0">
            <span className="text-[11px] sm:text-base md:text-lg font-extrabold font-heading text-primary">
              ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] sm:text-[11px] line-through text-text-muted">
              ₹{(Number(product.price) * 1.2).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Quick Add To Cart Button */}
        <button
          onClick={() => addToCartMutation.mutate()}
          disabled={addToCartMutation.isPending || product.stock === 0}
          className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl font-bold text-[9px] sm:text-sm transition-all shadow-soft cursor-pointer flex items-center space-x-0.5 sm:space-x-1.5 ${
            added
              ? 'bg-success text-white'
              : 'bg-primary text-white hover:bg-primary-hover'
          }`}
          title="Add to Cart directly"
        >
          {added ? (
            <>
              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Added</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="text-[9px] sm:text-sm">+ Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
