import { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import SideMenu from './SideMenu';
import AccountListsDropdown from './AccountListsDropdown';
import { useUserRole } from '../hooks/useUserRole';
import logo from '../assets/logo.png';
import {
  Menu,
  Search,
  ShoppingCart,
  ShoppingBag,
  BookOpen,
  Sprout,
  Tag,
  ChevronDown,
  ShieldCheck,
  LayoutDashboard,
  Users,
  FolderTree,
  Store,
  Package,
  Settings,
  UserCheck,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

const PRODUCT_CATEGORIES = [
  'All Categories',
  'Food & Spices',
  'Artisan Crafts',
  'Eco Living',
  'Organic Produce',
];

interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
}

export default function Navbar({
  searchQuery = '',
  onSearchChange,
  selectedCategory = 'All Categories',
  onCategorySelect,
}: NavbarProps) {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useUserRole();

  let currentCategory = '';
  if (location.pathname.startsWith('/shop/category/')) {
    currentCategory = decodeURIComponent(location.pathname.replace('/shop/category/', ''));
  } else if (location.pathname === '/shop') {
    currentCategory = searchParams.get('category') || 'All Categories';
  } else if (location.pathname === '/') {
    currentCategory = searchParams.get('category') || '';
  }

  const isFarmerDirectActive = location.pathname.startsWith('/shop') && searchParams.get('producerRole') === 'FARMER';
  const isMasterclassesActive = location.pathname === '/courses';

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [localCategory, setLocalCategory] = useState<string>(selectedCategory);

  // Fetch cart item count badge
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await apiClient.get('/cart');
      return res.data;
    },
    enabled: !!user,
  });

  const cartItems: any[] = cartData?.data?.items || [];
  const cartItemCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
    if (onCategorySelect) {
      onCategorySelect(localCategory);
    }
    if (localSearch) {
      navigate(`/shop?search=${encodeURIComponent(localSearch)}`);
    } else {
      navigate('/shop');
    }
  };

  const handleQuickCategoryClick = (cat: string) => {
    setLocalCategory(cat);
    if (onCategorySelect) {
      onCategorySelect(cat);
    }
    if (cat === 'All Categories') {
      navigate('/shop');
    } else {
      navigate(`/shop/category/${encodeURIComponent(cat)}`);
    }
  };

  const handleFarmerDirectClick = () => {
    navigate('/shop?producerRole=FARMER');
  };

  if (isAdmin) {
    return (
      <header className="bg-[#1B2E1E] border-b border-white/10 sticky top-0 z-40 text-white shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/admin/dashboard" className="flex items-center space-x-2.5 group shrink-0">
            <div className="p-1 bg-white rounded-xl border border-white/20 group-hover:scale-105 transition-transform overflow-hidden shadow-xs">
              <img src={logo} alt="EcoMarket" className="h-8 w-auto max-w-[120px] object-contain" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="brand-wordmark font-praise text-2xl sm:text-3xl tracking-normal text-white leading-none select-none">
                EcoMarket
              </span>
              <span className="text-[10px] bg-accent text-[#1B2E1E] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-body">
                Admin
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold overflow-x-auto no-scrollbar">
            <Link
              to="/admin/dashboard"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <LayoutDashboard className="w-4 h-4 text-accent" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/admin/products"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <Package className="w-4 h-4 text-accent" />
              <span>Products</span>
            </Link>
            <Link
              to="/admin/orders"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <ShoppingBag className="w-4 h-4 text-accent" />
              <span>Orders</span>
            </Link>
            <Link
              to="/admin/banners"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Banners</span>
            </Link>
            <Link
              to="/admin/categories"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <FolderTree className="w-4 h-4 text-accent" />
              <span>Categories</span>
            </Link>
            <Link
              to="/admin/users"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <Users className="w-4 h-4 text-accent" />
              <span>Users</span>
            </Link>
            <Link
              to="/admin/stores"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <Store className="w-4 h-4 text-accent" />
              <span>Stores</span>
            </Link>
            <Link
              to="/admin/onboarding"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4 text-accent" />
              <span>Approvals</span>
            </Link>
            <Link
              to="/admin/cancellation-requests"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-accent" />
              <span>Cancellations</span>
            </Link>
            <Link
              to="/admin/settings"
              className="px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-1.5"
            >
              <Settings className="w-4 h-4 text-accent" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Right Action: Clerk User Avatar */}
          <div className="flex items-center space-x-3 shrink-0">
            <SignedIn>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8 rounded-xl ring-2 ring-accent/30',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-background-card border-b border-text-muted/15 sticky top-0 z-40 shadow-soft">
        {/* Admin Operational Strip (Only for ADMIN role) */}
        {isAdmin && (
          <div className="bg-[#1B2E1E] text-white px-4 py-2 text-xs border-b border-white/10">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2 font-bold font-heading text-accent">
                <div className="bg-white rounded-md p-0.5 overflow-hidden">
                  <img src={logo} alt="EcoMarket" className="h-4 w-auto object-contain" />
                </div>
                <span>Admin Operations Portal</span>
              </div>
              <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar font-medium">
                <Link to="/admin/dashboard" className="hover:text-accent flex items-center space-x-1 transition-colors">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/admin/onboarding?tab=SELLER" className="hover:text-accent transition-colors">
                  Seller Approvals
                </Link>
                <Link to="/admin/onboarding?tab=FARMER" className="hover:text-accent transition-colors">
                  Farmer Approvals
                </Link>
                <Link to="/admin/onboarding?tab=EDUCATOR" className="hover:text-accent transition-colors">
                  Educator Approvals
                </Link>
                <Link to="/admin/categories" className="hover:text-accent flex items-center space-x-1 transition-colors">
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </Link>
                <Link to="/admin/users" className="hover:text-accent flex items-center space-x-1 transition-colors">
                  <Users className="w-3.5 h-3.5" />
                  <span>User Manager</span>
                </Link>
                <Link to="/" className="text-accent font-bold hover:underline flex items-center space-x-1 transition-colors border-l border-white/20 pl-3">
                  <Store className="w-3.5 h-3.5" />
                  <span>View Storefront</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Top Tier Header */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 md:gap-4">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open side menu"
              className="p-2 rounded-xl text-text-primary hover:bg-background-muted transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Menu className="w-5 h-5 text-primary" />
              <span className="hidden sm:inline text-xs font-bold text-text-secondary">Menu</span>
            </button>

            <Link to={isAdmin ? "/admin/dashboard" : "/"} className="flex items-center space-x-2 sm:space-x-2.5 group">
              <div className="p-1 bg-white rounded-xl border border-text-muted/15 group-hover:scale-105 transition-transform overflow-hidden shadow-xs">
                <img src={logo} alt="EcoMarket" className="h-8 sm:h-9 w-auto max-w-[130px] object-contain" />
              </div>
              <span className="brand-wordmark font-praise text-2xl sm:text-3xl text-primary tracking-normal leading-none select-none">
                EcoMarket
              </span>
              {isAdmin && (
                <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-bold font-body leading-normal">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Center: Integrated Amazon-Style Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl hidden md:flex items-center bg-background-muted/80 border border-text-muted/20 rounded-xl overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/40 transition-all"
          >
            {/* Category Select Dropdown */}
            <div className="relative border-r border-text-muted/20 bg-background-card shrink-0">
              <select
                value={localCategory}
                onChange={(e) => setLocalCategory(e.target.value)}
                className="py-2 pl-3 pr-7 bg-transparent text-xs font-semibold text-text-primary focus:outline-none appearance-none cursor-pointer"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Courses">Courses</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Search Input Box */}
            <input
              type="text"
              placeholder="Search organic produce, artisan crafts, or masterclasses..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-transparent text-text-primary focus:outline-none placeholder:text-text-muted"
            />

            {/* Search Submit Button */}
            <button
              type="submit"
              aria-label="Submit search"
              className="px-4 py-2 bg-primary text-white hover:bg-primary-hover transition-colors flex items-center justify-center cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right Action Icons: Account & Lists Dropdown + Shopping Cart */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {/* Amazon-Style Account & Lists Dropdown */}
            <AccountListsDropdown />

            {/* Shopping Cart Link */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-text-primary hover:bg-background-muted hover:text-primary transition-colors flex items-center space-x-1"
              aria-label="View Shopping Cart"
            >
              <ShoppingCart className="w-5.5 h-5.5 text-primary" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-soft animate-scale-in">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Clerk User Avatar (when signed in) */}
            <SignedIn>
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-text-muted/20">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox:
                        'w-8 h-8 sm:w-9 sm:h-9 border-2 border-primary/20 hover:border-primary transition-colors',
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>

        {/* Mobile Search Row (visible on small screens) */}
        <div className="px-3 pb-2.5 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-background-muted/80 border border-text-muted/20 rounded-xl overflow-hidden shadow-xs"
          >
            <input
              type="text"
              placeholder="Search products or courses..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-transparent text-text-primary focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="px-3.5 py-2 bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Secondary Category Shortcuts Tier (Horizontally Scrollable with Scroll Snap & Fade Cue) */}
        <div className="bg-background-muted/50 border-t border-text-muted/10 py-1.5 relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative after:pointer-events-none after:absolute after:right-0 after:top-0 after:bottom-0 after:w-10 after:bg-gradient-to-l after:from-background-card/90 after:to-transparent md:after:hidden">
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth text-xs font-medium text-text-secondary pr-8 md:pr-0">
              <button
                onClick={() => handleQuickCategoryClick('All Categories')}
                className={`px-3 py-1 rounded-lg shrink-0 snap-start transition-colors cursor-pointer ${
                  (location.pathname === '/shop' || (location.pathname === '/' && !searchParams.get('category'))) && currentCategory === 'All Categories' && !isFarmerDirectActive
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'hover:bg-background-card text-text-primary'
                }`}
              >
                All Products
              </button>

              {PRODUCT_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleQuickCategoryClick(cat)}
                  className={`px-3 py-1 rounded-lg shrink-0 snap-start transition-colors cursor-pointer ${
                    (location.pathname.startsWith('/shop') || location.pathname === '/') && currentCategory === cat && !isFarmerDirectActive
                      ? 'bg-primary text-white font-semibold shadow-xs'
                      : 'hover:bg-background-card text-text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <Link
                to="/courses"
                className={`px-3 py-1 rounded-lg shrink-0 snap-start font-bold transition-colors flex items-center space-x-1 ${
                  isMasterclassesActive
                    ? 'bg-secondary text-white shadow-xs'
                    : 'hover:bg-background-card text-secondary'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Masterclasses</span>
              </Link>

              <button
                onClick={handleFarmerDirectClick}
                className={`px-3 py-1 rounded-lg shrink-0 snap-start transition-colors flex items-center space-x-1 cursor-pointer ${
                  isFarmerDirectActive
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'hover:bg-background-card text-text-primary'
                }`}
              >
                <Sprout className={`w-3 h-3 ${isFarmerDirectActive ? 'text-white' : 'text-primary'}`} />
                <span>Farmer Direct</span>
              </button>

              <div
                title="Eco Deals — Coming soon!"
                className="px-3 py-1 rounded-lg shrink-0 snap-start text-text-muted/70 font-semibold flex items-center space-x-1.5 cursor-not-allowed opacity-75 border border-dashed border-text-muted/20"
              >
                <Tag className="w-3 h-3 text-text-muted" />
                <span>Eco Deals</span>
                <span className="text-[9px] bg-background-muted text-text-muted px-1.5 py-0.2 rounded-full font-normal">Soon</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Category Drawer Component */}
      <SideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={PRODUCT_CATEGORIES}
        selectedCategory={localCategory}
        onSelectCategory={handleQuickCategoryClick}
      />
    </>
  );
}
