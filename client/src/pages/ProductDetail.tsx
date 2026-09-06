import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/clerk-react';
import apiClient from '../api/axios';
import { Product, SentimentThemeItem } from '../types/product';
import {
  Leaf,
  ArrowLeft,
  Trash2,
  Edit3,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  MapPin,
  User,
  ShieldCheck,
  Award,
  MessageSquare,
  Send,
  Calendar,
  Package,
  Maximize2,
  X,
  Filter,
  Camera,
  Utensils,
  Plus,
  Minus,
  Truck,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  TrendingUp,
  RotateCcw,
  Lock,
  Store,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  photos?: string[];
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  user?: { name: string; email?: string };
}

interface ReviewsResponse {
  success: boolean;
  data: ReviewItem[];
  summary: {
    averageRating: number;
    totalReviews: number;
    breakdown: Record<number, number>;
    customerPhotos?: string[];
    sentimentThemes?: (string | SentimentThemeItem)[];
  };
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
}

// Helper to parse weight/volume from title/description for per-unit price display
const parsePerUnitPrice = (price: number, title: string, description: string) => {
  const text = `${title} ${description}`.toLowerCase();
  const matchGrams = text.match(/(\d+)\s*(g|grams)/);
  const matchKg = text.match(/(\d+)\s*(kg|kilograms)/);
  const matchMl = text.match(/(\d+)\s*(ml)/);

  if (matchGrams) {
    const weightGrams = parseInt(matchGrams[1], 10);
    if (weightGrams > 0) {
      const per100g = (price / weightGrams) * 100;
      return `(₹${per100g.toFixed(1)} / 100g)`;
    }
  } else if (matchKg) {
    const weightKg = parseInt(matchKg[1], 10);
    if (weightKg > 0) {
      const perKg = price / weightKg;
      return `(₹${perKg.toFixed(1)} / kg)`;
    }
  } else if (matchMl) {
    const volumeMl = parseInt(matchMl[1], 10);
    if (volumeMl > 0) {
      const per100ml = (price / volumeMl) * 100;
      return `(₹${per100ml.toFixed(1)} / 100ml)`;
    }
  }
  return null;
};

// Customer-appropriate stock indicator helper
const getStockStatus = (stock: number, threshold: number = 5) => {
  if (stock <= 0) {
    return {
      label: 'Out of Stock',
      badgeStyle: 'bg-error-light text-error border border-error/30',
      textStyle: 'text-error',
      inStock: false,
    };
  }
  if (stock <= threshold) {
    return {
      label: 'Only a few left',
      badgeStyle: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
      textStyle: 'text-amber-600 dark:text-amber-400',
      inStock: true,
    };
  }
  return {
    label: 'In Stock',
    badgeStyle: 'bg-success-light text-success border border-success/30',
    textStyle: 'text-success',
    inStock: true,
  };
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('top');
  const [reviewPage, setReviewPage] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [selectedSentimentFilter, setSelectedSentimentFilter] = useState<string | null>(null);

  // Review Form State
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [newPhotoInput, setNewPhotoInput] = useState<string>('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Accordion Expand/Collapse State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    sustainability: true,
    specs: false,
    seller: false,
  });

  const toggleAccordion = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllAccordions = () => {
    const allExpanded = Object.values(expandedSections).every(Boolean);
    setExpandedSections({
      overview: !allExpanded,
      sustainability: !allExpanded,
      specs: !allExpanded,
      seller: !allExpanded,
    });
  };

  // Fetch product detail query
  const { data, isLoading, isError, error } = useQuery<{ success: boolean; data: Product }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const product = data?.data;

  // Fetch product reviews query
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    refetch: refetchReviews,
  } = useQuery<ReviewsResponse>({
    queryKey: ['product-reviews', id, reviewPage],
    queryFn: async () => {
      const res = await apiClient.get<ReviewsResponse>(`/products/${id}/reviews?page=${reviewPage}&limit=6`);
      return res.data;
    },
    enabled: !!id,
  });

  // Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, comment, photos }: { rating: number; comment: string; photos: string[] }) => {
      const token = await getToken();
      await apiClient.post(
        `/products/${id}/reviews`,
        { rating, comment, photos },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setReviewMsg({ type: 'success', text: 'Thank you! Your review has been published.' });
      setNewComment('');
      setNewRating(5);
      setNewPhotos([]);
      setNewPhotoInput('');
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ['product-reviews', id] });
    },
    onError: (err: any) => {
      setReviewMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to submit review. Please try again.',
      });
    },
  });

  // Scroll Spy for Sticky Navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['top', 'product-details', 'product-info', 'reviews'];
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  // User role check
  const userRole = (clerkUser?.publicMetadata?.role as string) || 'CUSTOMER';
  const isOwner =
    (clerkUser && product?.seller?.clerkId === clerkUser.id) || userRole === 'ADMIN';

  // Add to Cart Mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        navigate('/login');
        return;
      }
      const token = await getToken();
      await apiClient.post(
        '/cart/items',
        { productId: product?.id, quantity, itemType: 'PRODUCT' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      setAdded(true);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setTimeout(() => setAdded(false), 2500);
    },
  });

  // Buy Now (Add to Cart + Navigate to Checkout)
  const handleBuyNow = async () => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }
    await addToCartMutation.mutateAsync();
    navigate('/checkout');
  };

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      await apiClient.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      navigate('/shop');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-text-secondary">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="bg-error-light border border-error/30 rounded-2xl p-8 space-y-4">
          <AlertCircle className="w-10 h-10 mx-auto text-error" />
          <h2 className="text-2xl font-bold text-error font-heading">Product Not Available</h2>
          <p className="text-xs text-error/90 max-w-md mx-auto">
            {(error as any)?.response?.data?.error?.message || 'The requested product does not exist or is currently unavailable.'}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  ];

  const summary = reviewsData?.summary || { averageRating: 0, totalReviews: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, customerPhotos: [], sentimentThemes: [] };
  const rawReviewsList = reviewsData?.data || [];
  const pagination = reviewsData?.pagination || { page: 1, totalPages: 1 };

  // Filter reviews by sentiment chip if selected
  const reviewsList = selectedSentimentFilter
    ? rawReviewsList.filter((r) =>
        r.comment?.toLowerCase().includes(selectedSentimentFilter.toLowerCase())
      )
    : rawReviewsList;

  // Check if Food & Spices category for Recipe / Usage Card
  const isFoodAndSpices = product.category.toLowerCase().includes('food') || product.category.toLowerCase().includes('spice');
  const hasUsageContent = isFoodAndSpices && !!product.usageContent && (!!product.usageContent.title || !!product.usageContent.description || (product.usageContent.steps && product.usageContent.steps.length > 0));

  const stockStatus = getStockStatus(product.stock, product.lowStockThreshold);

  // Per-unit price calculation if applicable
  const perUnitPriceStr = parsePerUnitPrice(Number(product.price), product.title, product.description);

  // Formatted 30-day sales count text if >= 5
  const monthlySalesCount = product.monthlySalesCount || 0;
  const salesCountText = monthlySalesCount >= 5
    ? `${Math.floor(monthlySalesCount / 10) * 10 || monthlySalesCount}+ bought in past month`
    : null;

  // Producer Link details (Compact single line)
  const producerName = product.producer?.name || product.seller?.producer?.name || product.seller?.name;
  const producerTarget = product.producerId ? `/producer/${product.producerId}` : `/shop?sellerId=${product.sellerId}`;

  return (
    <div className="relative space-y-8 pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="bg-background-card border-b border-text-muted/15 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 text-xs text-text-muted overflow-x-auto no-scrollbar">
          <Link to="/shop" className="hover:text-primary transition-colors whitespace-nowrap">
            All Products
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors font-medium text-text-secondary whitespace-nowrap">
            {product.category}
          </Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="font-semibold text-text-primary truncate max-w-[200px] sm:max-w-md">
            {product.title}
          </span>
        </div>
      </div>

      {/* Sticky In-Page Section Navigation */}
      <div className="sticky top-16 z-30 bg-background-card/95 backdrop-blur-md border-b border-text-muted/15 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12 text-xs font-semibold">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => scrollToSection('top')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'top'
                  ? 'bg-primary text-white font-bold shadow-soft'
                  : 'text-text-secondary hover:text-primary hover:bg-background-muted'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('product-details')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'product-details'
                  ? 'bg-primary text-white font-bold shadow-soft'
                  : 'text-text-secondary hover:text-primary hover:bg-background-muted'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => scrollToSection('product-info')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'product-info'
                  ? 'bg-primary text-white font-bold shadow-soft'
                  : 'text-text-secondary hover:text-primary hover:bg-background-muted'
              }`}
            >
              Product Info & Safety
            </button>
            <button
              onClick={() => scrollToSection('reviews')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeSection === 'reviews'
                  ? 'bg-primary text-white font-bold shadow-soft'
                  : 'text-text-secondary hover:text-primary hover:bg-background-muted'
              }`}
            >
              Reviews ({summary.totalReviews})
            </button>
          </div>

          <Link
            to="/shop"
            className="hidden md:flex items-center space-x-1 text-text-secondary hover:text-primary text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Owner Controls Header */}
        {isOwner && (
          <div className="flex items-center justify-between bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Seller Control Panel (Managing your product)
            </span>
            <div className="flex items-center space-x-3">
              <Link
                to={`/seller/products/edit/${product.id}`}
                className="flex items-center space-x-1.5 px-3 py-1 bg-background-card border border-text-muted/20 hover:bg-background-muted text-xs font-semibold text-text-primary rounded-xl transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>Edit Product</span>
              </Link>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center space-x-1.5 px-3 py-1 bg-error-light border border-error/30 hover:bg-error text-error hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-error-light p-1 rounded-xl border border-error/30">
                  <span className="text-xs text-error font-bold px-2">Confirm?</span>
                  <button
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                    className="px-2.5 py-1 bg-error text-white text-xs font-bold rounded-lg hover:bg-error/90"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-2 py-1 bg-background-card text-text-primary text-xs font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 1: 3-COLUMN ASYMMETRIC DESKTOP LAYOUT (ABOVE THE FOLD) */}
        <section id="top" className="scroll-mt-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1: IMAGE GALLERY (4 Cols, Sticky on Desktop) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <div className="flex flex-col-reverse md:flex-row gap-3">
                {/* Vertical Thumbnails */}
                {images.length > 1 && (
                  <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2.5 overflow-x-auto md:overflow-y-auto max-h-[420px] pb-2 md:pb-0 shrink-0 no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          activeImageIdx === idx
                            ? 'border-primary ring-2 ring-primary/30 scale-95'
                            : 'border-text-muted/20 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Hero Box */}
                <div
                  onClick={() => setLightboxOpen(true)}
                  className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-background-card border border-text-muted/15 shadow-soft group cursor-zoom-in"
                >
                  <img
                    src={images[activeImageIdx]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-background-card/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-primary border border-text-muted/10 shadow-soft">
                    {product.category}
                  </div>

                  <div className="absolute bottom-3 right-3 p-2 bg-background-card/90 backdrop-blur-md rounded-xl text-text-primary opacity-80 group-hover:opacity-100 transition-opacity shadow-soft">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: CENTER TITLE & PRODUCT INFORMATION COLUMN (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3">
                {/* 1. Main Product Title */}
                <h1 className="text-2xl md:text-3xl font-bold font-heading text-text-primary leading-tight">
                  {product.title}
                </h1>

                {/* 2. COMPACT PRODUCER/SELLER BADGE (Replaces large producer section) */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-primary-light/60 text-primary font-bold rounded-full border border-primary/20">
                    <Leaf className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Producer / Store:</span>
                  </span>
                  <Link
                    to={producerTarget}
                    className="font-bold text-primary hover:underline flex items-center space-x-1"
                  >
                    <span>{producerName}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* 3. Rating + Review Count & 4. Real Social Proof Line */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {summary.totalReviews > 0 && (
                    <div
                      onClick={() => scrollToSection('reviews')}
                      className="flex items-center space-x-2 text-xs cursor-pointer py-1 px-3 bg-background-muted rounded-full hover:bg-primary-light/50 transition-colors"
                    >
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="font-bold ml-1 text-text-primary">{summary.averageRating}</span>
                      </div>
                      <span className="text-text-muted">•</span>
                      <span className="text-primary font-semibold hover:underline">
                        {summary.totalReviews} customer {summary.totalReviews === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                  )}

                  {salesCountText && (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-secondary-light/60 text-secondary text-xs font-bold rounded-full border border-secondary/20">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{salesCountText}</span>
                    </div>
                  )}
                </div>

                {/* 5. Price (Large) with per-unit price if applicable */}
                <div className="pt-2 flex items-baseline space-x-2">
                  <span className="text-3xl font-extrabold font-heading text-primary">
                    ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {perUnitPriceStr && (
                    <span className="text-xs text-text-muted font-medium">
                      {perUnitPriceStr}
                    </span>
                  )}
                </div>

                {/* Sustainability Badges */}
                {product.sustainabilityTags?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                      Sustainability & Impact Assurance
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sustainabilityTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1.5 bg-primary-light text-primary text-[11px] px-3 py-1 rounded-full font-semibold border border-primary/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{tag}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ACCORDION SECTIONS */}
              <div id="product-details" className="scroll-mt-28 space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-heading text-primary uppercase tracking-wider">
                    Product Specifications
                  </h3>
                  <button
                    onClick={toggleAllAccordions}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center space-x-1"
                  >
                    <span>
                      {Object.values(expandedSections).every(Boolean) ? 'Collapse all specs' : 'See all product specifications'}
                    </span>
                  </button>
                </div>

                <div className="bg-background-card rounded-2xl border border-text-muted/15 shadow-soft divide-y divide-text-muted/15 overflow-hidden">
                  {/* Overview / Summary */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('overview')}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-text-primary hover:bg-background-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-primary" />
                        <span>Product Summary</span>
                      </div>
                      {expandedSections.overview ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                    {expandedSections.overview && (
                      <div className="p-4 pt-0 text-xs text-text-secondary leading-relaxed border-t border-text-muted/10 bg-background-card">
                        {product.description}
                      </div>
                    )}
                  </div>

                  {/* Specs */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('specs')}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-text-primary hover:bg-background-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>Category & Availability</span>
                      </div>
                      {expandedSections.specs ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                    {expandedSections.specs && (
                      <div className="p-4 pt-0 border-t border-text-muted/10 bg-background-card">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="flex justify-between p-2.5 bg-background-muted/50 rounded-xl border border-text-muted/10">
                            <span className="text-text-secondary">Category</span>
                            <strong className="text-text-primary">{product.category}</strong>
                          </div>
                          <div className="flex justify-between p-2.5 bg-background-muted/50 rounded-xl border border-text-muted/10">
                            <span className="text-text-secondary">Availability Status</span>
                            <strong className={`font-bold ${stockStatus.textStyle}`}>
                              {stockStatus.label}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Seller Credentials */}
                  <div>
                    <button
                      onClick={() => toggleAccordion('seller')}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-text-primary hover:bg-background-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-primary" />
                        <span>Seller Credentials</span>
                      </div>
                      {expandedSections.seller ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>
                    {expandedSections.seller && (
                      <div className="p-4 pt-0 border-t border-text-muted/10 bg-background-card text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-xs text-text-primary">{product.seller?.name || 'Verified Merchant'}</h4>
                            <p className="text-text-muted text-[10px]">{product.seller?.email}</p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-secondary-light text-secondary font-bold text-[10px] uppercase rounded-full">
                            {product.seller?.role || 'SELLER'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recipe / Use Cards */}
              {hasUsageContent && (
                <div className="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold font-heading text-sm">
                    <Utensils className="w-4 h-4 text-primary" />
                    <span>Recommended Recipe & Culinary Guide</span>
                  </div>
                  {product.usageContent?.title && (
                    <h4 className="text-xs font-bold text-text-primary">{product.usageContent.title}</h4>
                  )}
                  {product.usageContent?.description && (
                    <p className="text-xs text-text-secondary leading-relaxed">{product.usageContent.description}</p>
                  )}
                  {product.usageContent?.steps && product.usageContent.steps.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-text-muted uppercase">Preparation Steps:</span>
                      <ol className="list-decimal list-inside text-xs text-text-secondary space-y-1 pl-1">
                        {product.usageContent.steps.map((step, idx) => (
                          <li key={idx} className="leading-normal">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Similar Items Widget */}
              {product.similarProducts && product.similarProducts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold font-heading text-primary uppercase tracking-wider flex items-center space-x-1.5">
                    <SparklesIcon className="w-4 h-4 text-primary" />
                    <span>Consider A Similar Item</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {product.similarProducts.map((item) => (
                      <Link
                        key={item.id}
                        to={`/product/${item.id}`}
                        className="group bg-background-card p-2.5 rounded-2xl border border-text-muted/15 hover:border-primary/40 shadow-soft transition-all space-y-2 flex flex-col justify-between"
                      >
                        <div className="aspect-square rounded-xl overflow-hidden bg-background-muted">
                          <img
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-[11px] font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {item.title}
                          </h5>
                          <span className="text-xs font-bold font-heading text-primary block">
                            ₹{Number(item.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 3: STICKY FLOATING BUY BOX (3 Cols, Sticky on Desktop) */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
              <div className="p-5 bg-background-card rounded-2xl border border-text-muted/15 shadow-soft space-y-4">
                {/* Price Display */}
                <div className="space-y-1 border-b border-text-muted/10 pb-3">
                  <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider block">Total Price</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-extrabold font-heading text-primary">
                      ₹{Number(product.price * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Delivery Estimate */}
                <div className="flex items-start space-x-2 text-xs text-text-secondary">
                  <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-text-primary block">Delivery Estimate</span>
                    <span className="text-[11px]">{product.estimatedDeliveryDays || '5-7 business days'}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="flex items-start space-x-2 text-xs text-text-secondary border-t border-b border-text-muted/10 py-2.5">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    {product.userDefaultAddress ? (
                      <>
                        <span className="font-bold text-text-primary block">Deliver to {product.userDefaultAddress.city}</span>
                        <span className="text-text-muted">Pincode: {product.userDefaultAddress.pincode} ({product.userDefaultAddress.label})</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-text-primary block">Deliver to your address</span>
                        <Link to="/account" className="text-primary font-bold hover:underline">Select or add address</Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Availability Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">Stock Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${stockStatus.badgeStyle}`}>
                    {stockStatus.label}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-secondary">Quantity</label>
                  <div className="flex items-center space-x-3 bg-background-muted p-1 rounded-xl border border-text-muted/15 w-fit">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || !stockStatus.inStock}
                      className="p-1 rounded-lg hover:bg-background-card text-text-primary disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-text-primary font-mono px-2">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={!stockStatus.inStock}
                      className="p-1 rounded-lg hover:bg-background-card text-text-primary disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Add to Cart + Buy Now */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => addToCartMutation.mutate()}
                    disabled={!stockStatus.inStock || addToCartMutation.isPending}
                    className={`w-full py-3 font-bold text-xs rounded-xl transition-all shadow-soft flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 ${
                      added
                        ? 'bg-success text-white'
                        : 'bg-primary text-white hover:bg-primary-hover'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!stockStatus.inStock || addToCartMutation.isPending}
                    className="w-full py-3 bg-secondary text-white hover:bg-secondary/90 font-bold text-xs rounded-xl transition-all shadow-soft flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Merchant & Trust Lines */}
                <div className="space-y-2 pt-3 border-t border-text-muted/10 text-[11px] text-text-secondary">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Sold by</span>
                    <a
                      href={`/shop?sellerId=${product.sellerId}`}
                      className="font-bold text-primary hover:underline truncate max-w-[140px]"
                    >
                      {product.seller?.name || 'Verified Merchant'}
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Returns</span>
                    <Link to="/returns" className="font-semibold text-primary hover:underline flex items-center space-x-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>30-Day Policy</span>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Payment</span>
                    <span className="font-semibold text-text-primary flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-success" />
                      <span>Secure Checkout</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: STRUCTURED PRODUCT INFORMATION SECTIONS (Lower Page) */}
        <section id="product-info" className="scroll-mt-28 space-y-6">
          <div className="border-b border-text-muted/15 pb-3">
            <h2 className="text-2xl font-bold font-heading text-primary">Product Information & Safety Notes</h2>
            <p className="text-xs text-text-secondary">Detailed description, ingredient details, usage directions, and safety disclaimers</p>
          </div>

          <div className="bg-background-card rounded-3xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-8">
            {/* 1. Full Product Description Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-heading text-primary uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Product Description</span>
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-background-muted/40 p-5 rounded-2xl border border-text-muted/10">
                {product.description}
              </p>
            </div>

            {/* 2. Ingredients Section (Rendered ONLY if filled in) */}
            {product.ingredients && product.ingredients.trim() && (
              <div className="space-y-3 border-t border-text-muted/10 pt-6">
                <h3 className="text-sm font-bold font-heading text-primary uppercase tracking-wider flex items-center space-x-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  <span>Ingredients & Composition</span>
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-background-muted/40 p-5 rounded-2xl border border-text-muted/10">
                  {product.ingredients}
                </p>
              </div>
            )}

            {/* 3. Directions / Usage Info Section (Rendered ONLY if filled in) */}
            {product.usageDirections && product.usageDirections.trim() && (
              <div className="space-y-3 border-t border-text-muted/10 pt-6">
                <h3 className="text-sm font-bold font-heading text-primary uppercase tracking-wider flex items-center space-x-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span>Directions & Storage Instructions</span>
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-background-muted/40 p-5 rounded-2xl border border-text-muted/10">
                  {product.usageDirections}
                </p>
              </div>
            )}

            {/* 4. Safety Information Section (Rendered ONLY if filled in) */}
            {product.safetyInfo && product.safetyInfo.trim() && (
              <div className="space-y-3 border-t border-text-muted/10 pt-6">
                <h3 className="text-sm font-bold font-heading text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Safety Information & Allergen Warnings</span>
                </h3>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed whitespace-pre-line bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20">
                  {product.safetyInfo}
                </p>
              </div>
            )}

            {/* 5. Centralized Platform Legal Disclaimer (From SiteSettings) */}
            <div className="border-t border-text-muted/10 pt-6">
              <div className="p-4 bg-background-muted/60 rounded-2xl border border-text-muted/15 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-text-primary block">Legal Disclaimer</span>
                  <p className="text-text-muted text-[11px] leading-relaxed">
                    {product.legalDisclaimerText ||
                      'Product information is provided by individual sellers and producers on this platform. Please review packaging and product details carefully before use. For food items, always check for allergens and storage instructions. This platform does not independently verify seller-provided claims.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: REVIEWS & CUSTOMER FEEDBACK */}
        <section id="reviews" className="scroll-mt-28 space-y-6">
          <div className="border-b border-text-muted/15 pb-3">
            <h2 className="text-2xl font-bold font-heading text-primary">Customer Reviews & Ratings</h2>
            <p className="text-xs text-text-secondary">Real feedback from verified purchasers</p>
          </div>

          <div className="bg-background-card rounded-3xl p-6 sm:p-8 border border-text-muted/15 shadow-soft space-y-8">
            {/* Rating Breakdown Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-b border-text-muted/15 pb-8">
              {/* Overall Rating Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-background-muted/50 rounded-2xl border border-text-muted/10 text-center space-y-2">
                <span className="text-5xl font-extrabold font-heading text-primary">{summary.averageRating}</span>
                <div className="flex items-center space-x-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(summary.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-text-muted/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-text-muted">
                  Based on {summary.totalReviews} {summary.totalReviews === 1 ? 'customer review' : 'customer reviews'}
                </p>
              </div>

              {/* Rating Bar Chart */}
              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = summary.breakdown?.[star] || 0;
                  const percent = summary.totalReviews > 0 ? Math.round((count / summary.totalReviews) * 100) : 0;

                  return (
                    <div key={star} className="flex items-center space-x-3 text-xs">
                      <div className="flex items-center space-x-1 w-10 font-bold text-text-primary shrink-0">
                        <span>{star}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      </div>

                      <div className="flex-1 h-3.5 bg-background-muted rounded-full overflow-hidden border border-text-muted/10">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <span className="w-10 text-right font-mono font-semibold text-text-secondary shrink-0">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI-EXTRACTED SENTIMENT CHIPS */}
            {summary.sentimentThemes && summary.sentimentThemes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs text-text-muted font-bold uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>Key Customer Themes (AI Sentiment Analyzed):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSentimentFilter(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      selectedSentimentFilter === null
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-background-muted text-text-secondary hover:bg-text-muted/10'
                    }`}
                  >
                    All Reviews
                  </button>
                  {summary.sentimentThemes.map((item, idx) => {
                    const name = typeof item === 'string' ? item : item.name;
                    const sentiment = typeof item === 'string' ? 'positive' : item.sentiment || 'positive';
                    const isPositive = sentiment === 'positive';
                    const active = selectedSentimentFilter === name;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSentimentFilter(active ? null : name)}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-primary text-white shadow-soft ring-2 ring-primary/30'
                            : isPositive
                            ? 'bg-success-light text-success border border-success/30 hover:bg-success/20'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        <span>#{name}</span>
                        {isPositive ? (
                          <ArrowUp className="w-3 h-3 text-success shrink-0" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-amber-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CUSTOMER MEDIA STRIP */}
            {summary.customerPhotos && summary.customerPhotos.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2 text-xs text-text-primary font-bold">
                  <Camera className="w-4 h-4 text-primary" />
                  <span>Customer Photos ({summary.customerPhotos.length})</span>
                </div>
                <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                  {summary.customerPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveImageIdx(images.indexOf(photo) !== -1 ? images.indexOf(photo) : 0);
                        setLightboxOpen(true);
                      }}
                      className="w-20 h-20 rounded-xl overflow-hidden border border-text-muted/20 shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img src={photo} alt={`Customer upload ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Write a Review Section */}
            <div className="bg-background-muted/40 rounded-2xl p-5 border border-text-muted/15 space-y-4">
              <h3 className="text-xs font-bold font-heading text-text-primary flex items-center space-x-2 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Write a Product Review</span>
              </h3>

              {!isSignedIn ? (
                <p className="text-xs text-text-muted">
                  Please{' '}
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    sign in
                  </Link>{' '}
                  to leave feedback on this product.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newComment.trim()) return;
                    submitReviewMutation.mutate({ rating: newRating, comment: newComment, photos: newPhotos });
                  }}
                  className="space-y-4"
                >
                  {reviewMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center space-x-2 border ${
                        reviewMsg.type === 'success'
                          ? 'bg-success-light text-success border-success/30'
                          : 'bg-error-light text-error border-error/30'
                      }`}
                    >
                      {reviewMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{reviewMsg.text}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-text-secondary">Your Rating:</span>
                    <div className="flex items-center space-x-1 cursor-pointer">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-text-muted/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Share your experience with this item..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 bg-background-card border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-text-secondary">Attach Photo URL (Optional):</label>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newPhotoInput}
                        onChange={(e) => setNewPhotoInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-background-card border border-text-muted/20 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPhotoInput.trim() && newPhotoInput.startsWith('http')) {
                            setNewPhotos((p) => [...p, newPhotoInput.trim()]);
                            setNewPhotoInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-background-muted text-xs font-semibold rounded-xl border border-text-muted/20"
                      >
                        Attach
                      </button>
                    </div>

                    {newPhotos.length > 0 && (
                      <div className="flex space-x-2 pt-1">
                        {newPhotos.map((photo, idx) => (
                          <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border">
                            <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewPhotos((p) => p.filter((_, i) => i !== idx))}
                              className="absolute top-0 right-0 p-0.5 bg-error text-white rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitReviewMutation.isPending}
                      className="px-5 py-2 bg-primary text-white hover:bg-primary-hover text-xs font-bold rounded-xl transition-all shadow-soft flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submitReviewMutation.isPending ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Submit Review</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Written Reviews List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-heading text-text-primary uppercase tracking-wider">
                  Customer Comments ({reviewsList.length})
                </h3>
                {selectedSentimentFilter && (
                  <span className="text-[11px] text-primary font-semibold">
                    Filtered by #{selectedSentimentFilter}
                  </span>
                )}
              </div>

              {isLoadingReviews ? (
                <div className="py-8 text-center text-xs text-text-muted">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : reviewsList.length === 0 ? (
                <div className="py-8 text-center bg-background-muted/30 rounded-2xl border border-text-muted/10 space-y-1">
                  <p className="text-xs font-semibold text-text-primary">No reviews matching criteria</p>
                  <p className="text-[11px] text-text-muted">Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-text-muted/10">
                  {reviewsList.map((rev, idx) => (
                    <div key={rev.id || idx} className={idx > 0 ? 'pt-4' : ''}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-xs flex items-center justify-center">
                              {rev.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-text-primary">{rev.user?.name || 'Verified Buyer'}</h4>
                              <span className="text-[10px] text-text-muted flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 text-amber-500 bg-background-muted px-2.5 py-1 rounded-full text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-text-primary">{rev.rating}</span>
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-text-secondary leading-relaxed bg-background-muted/20 p-3 rounded-xl">
                            {rev.comment}
                          </p>
                        )}

                        {rev.photos && rev.photos.length > 0 && (
                          <div className="flex space-x-2 pt-1">
                            {rev.photos.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => {
                                  setActiveImageIdx(images.indexOf(photo) !== -1 ? images.indexOf(photo) : 0);
                                  setLightboxOpen(true);
                                }}
                                className="w-16 h-16 rounded-lg overflow-hidden border border-text-muted/20 cursor-pointer"
                              >
                                <img src={photo} alt="Customer upload" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {rev.reply && (
                          <div className="ml-6 mt-2 p-3 bg-primary-light/40 border-l-2 border-primary rounded-r-xl text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-primary text-[11px]">
                              <span>Seller Response</span>
                              {rev.repliedAt && <span>{new Date(rev.repliedAt).toLocaleDateString()}</span>}
                            </div>
                            <p className="text-text-secondary">{rev.reply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-text-muted/10 text-xs">
                  <button
                    onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                    disabled={reviewPage <= 1}
                    className="px-3.5 py-1.5 bg-background-muted rounded-xl text-text-primary font-semibold hover:bg-primary-light disabled:opacity-30 cursor-pointer"
                  >
                    Previous Page
                  </button>
                  <span className="text-text-muted font-mono">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setReviewPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={reviewPage >= pagination.totalPages}
                    className="px-3.5 py-1.5 bg-background-muted rounded-xl text-text-primary font-semibold hover:bg-primary-light disabled:opacity-30 cursor-pointer"
                  >
                    Next Page
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* LIGHTBOX MODAL OVERLAY */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-primary transition-colors cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl">
              <img
                src={images[activeImageIdx]}
                alt={product.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            {images.length > 1 && (
              <div className="flex space-x-2 pt-4 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer ${
                      activeImageIdx === idx ? 'border-primary ring-2 ring-primary/40' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
