import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { ProductsResponse } from '../types/product';
import ProductCard from '../components/ProductCard';
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronRight as ArrowIcon,
  SlidersHorizontal,
  Check,
  Tag,
} from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';
import { Navigate } from 'react-router-dom';

const CATEGORIES = ['All Categories', 'Food & Spices', 'Artisan Crafts', 'Eco Living', 'Organic Produce'];

export default function Shop() {
  const { isAdmin } = useUserRole();
  const { categoryName } = useParams<{ categoryName?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<number>(1);

  // Derive initial category from path parameter or URL query string
  const initialCategory = categoryName
    ? decodeURIComponent(categoryName)
    : searchParams.get('category') || 'All Categories';

  const searchFromUrl = searchParams.get('search') || '';
  const producerRoleFromUrl = searchParams.get('producerRole') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [search, setSearch] = useState<string>(searchFromUrl);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Synchronize state when URL path parameter or search params change
  useEffect(() => {
    const activeCategory = categoryName
      ? decodeURIComponent(categoryName)
      : searchParams.get('category') || 'All Categories';
    setSelectedCategory(activeCategory);
  }, [categoryName, searchParams]);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  // Fetch products via TanStack Query
  const { data, isLoading, isError, error, refetch } = useQuery<ProductsResponse>({
    queryKey: ['shop-products', page, selectedCategory, search, minPrice, maxPrice, producerRoleFromUrl],
    queryFn: async () => {
      const params: any = { page, limit: 12 };
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (search) params.search = search;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (producerRoleFromUrl) params.producerRole = producerRoleFromUrl;

      const res = await apiClient.get<ProductsResponse>('/products', { params });
      return res.data;
    },
    enabled: !isAdmin,
  });

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const products = data?.data || [];
  const pagination = data?.pagination;

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setPage(1);
    if (cat === 'All Categories') {
      navigate('/shop');
    } else {
      navigate(`/shop/category/${encodeURIComponent(cat)}`);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('All Categories');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    navigate('/shop');
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-3 sm:px-6 lg:px-8 space-y-6">
      {/* Dedicated Breadcrumb Trail */}
      <nav className="flex items-center space-x-1.5 text-xs text-text-muted">
        <Link to="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ArrowIcon className="w-3 h-3 text-text-muted" />
        <Link to="/shop" className="hover:text-primary transition-colors">
          Marketplace
        </Link>
        {selectedCategory !== 'All Categories' && (
          <>
            <ArrowIcon className="w-3 h-3 text-text-muted" />
            <span className="font-semibold text-text-primary">{selectedCategory}</span>
          </>
        )}
      </nav>

      {/* Clean Dedicated Category Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-text-muted/15 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-primary-light text-primary px-2.5 py-0.5 rounded-full text-xs font-bold border border-primary/20">
            <Tag className="w-3 h-3" />
            <span>{selectedCategory === 'All Categories' ? 'All Products Catalog' : selectedCategory}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-text-primary tracking-tight">
            {selectedCategory === 'All Categories' ? 'Ethical & Eco-Friendly Marketplace' : `${selectedCategory} Collection`}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl">
            {selectedCategory === 'All Categories'
              ? 'Browse verified sustainable goods direct from local organic farmers and eco-artisans.'
              : `Explore handcrafted, high-quality ${selectedCategory.toLowerCase()} sourced directly with transparent eco-standards.`}
          </p>
        </div>

        {pagination && (
          <span className="px-3 py-1.5 bg-background-muted/80 text-text-secondary text-xs font-bold rounded-xl border border-text-muted/15 shrink-0 self-start sm:self-center">
            {pagination.total} Products Available
          </span>
        )}
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden flex items-center justify-between bg-background-card p-3 rounded-2xl border border-text-muted/15 shadow-soft">
        <div className="flex items-center space-x-2 text-xs font-semibold text-text-primary">
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span>Product Catalog ({pagination?.total || 0})</span>
        </div>
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-light text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Desktop Layout: Catalog Filters Sidebar + Main Product Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left-Hand Filter Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block space-y-5 bg-background-card rounded-2xl p-5 border border-text-muted/15 shadow-soft sticky top-24">
          <div className="flex items-center justify-between border-b border-text-muted/15 pb-3">
            <h3 className="font-heading font-bold text-sm text-text-primary flex items-center space-x-2">
              <Filter className="w-4 h-4 text-primary" />
              <span>Catalog Filters</span>
            </h3>
            {(selectedCategory !== 'All Categories' || search || minPrice || maxPrice) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-error hover:underline font-semibold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Keyword Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Search Keywords
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Category Selection Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Product Categories
            </label>
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-soft'
                      : 'hover:bg-background-muted text-text-secondary'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-1.5 pt-2 border-t border-text-muted/15">
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
              Price Range (₹)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-text-muted text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </aside>

        {/* Mobile Slide-Up Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="relative mt-auto w-full bg-background-card rounded-t-3xl p-6 space-y-5 shadow-card max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-text-muted/15 pb-3">
                <h3 className="font-heading font-bold text-base">Filter Catalog</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg hover:bg-background-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategorySelect(e.target.value)}
                    className="w-full p-2.5 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Min Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setPage(1);
                      }}
                      className="w-full p-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      Max Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setPage(1);
                      }}
                      className="w-full p-2 bg-background-muted/60 border border-text-muted/20 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full py-3 bg-primary text-white font-bold text-xs rounded-xl shadow-soft"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Main Product Grid Area */}
        <main className="flex-1 space-y-6 w-full">
          {isLoading ? (
            <div className="py-20 text-center text-text-secondary space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-sm font-medium">Loading catalog products...</p>
            </div>
          ) : isError ? (
            <div className="bg-error-light border border-error/30 rounded-2xl p-8 text-center space-y-4">
              <AlertCircle className="w-10 h-10 mx-auto text-error" />
              <h3 className="text-lg font-bold text-error font-heading">Failed to Load Products</h3>
              <p className="text-xs text-error/90 max-w-md mx-auto">
                {(error as any)?.response?.data?.error?.message || (error as any)?.message || 'An error occurred'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-error text-white text-xs font-semibold rounded-lg hover:bg-error/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-background-card rounded-2xl p-12 text-center border border-text-muted/15 space-y-4">
              <ShoppingBag className="w-12 h-12 mx-auto text-text-muted opacity-50" />
              <h3 className="text-xl font-bold font-heading">No Products Found</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                We couldn't find any products matching your active filters or search terms in {selectedCategory}. Try clearing your search query or selecting another category.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-hover transition-colors shadow-soft"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-text-muted/15 pt-6 text-sm">
                  <span className="text-xs text-text-secondary">
                    Showing page <strong className="text-text-primary">{pagination.page}</strong> of{' '}
                    <strong className="text-text-primary">{pagination.totalPages}</strong> ({pagination.total} total items)
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-text-muted/20 hover:bg-background-muted text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-text-muted/20 hover:bg-background-muted text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
