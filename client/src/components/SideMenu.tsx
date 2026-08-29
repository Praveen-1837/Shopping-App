import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useUserRole } from '../hooks/useUserRole';
import {
  X,
  User,
  Package,
  BookOpen,
  Briefcase,
  Sprout,
  Award,
  ShieldCheck,
  HelpCircle,
  Mail,
  Shield,
  FileText,
  ChevronRight,
  GraduationCap,
  Heart,
} from 'lucide-react';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function SideMenu({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
}: SideMenuProps) {
  const { user } = useUser();
  const { canAccessSellerCentre, canAccessFarmerCentre, canAccessEducatorCentre, isAdmin, isCustomer } = useUserRole();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape key listener & focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Side category menu"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer content panel */}
      <div
        ref={drawerRef}
        className="relative w-4/5 max-w-sm bg-background-card h-full shadow-2xl flex flex-col z-10 animate-slide-in overflow-y-auto no-scrollbar"
      >
        {/* Amazon-style User Greeting Header */}
        <div className="bg-primary px-5 py-4 text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <User className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <SignedIn>
                <span className="text-xs font-medium text-white/80 block">Hello,</span>
                <span className="text-sm font-bold font-heading">{user?.firstName || 'Customer'}</span>
              </SignedIn>
              <SignedOut>
                <span className="text-xs font-medium text-white/80 block">Hello,</span>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="text-sm font-bold font-heading hover:underline text-secondary"
                >
                  Sign In
                </Link>
              </SignedOut>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Body Content */}
        <div className="p-4 space-y-6">
          {/* Section 1: Shop Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-heading uppercase text-text-muted tracking-wider px-2">
              Shop by Category
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-white font-bold'
                      : 'hover:bg-background-muted text-text-primary'
                  }`}
                >
                  <span>{cat}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      selectedCategory === cat ? 'text-white' : 'text-text-muted'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Learning & Masterclasses */}
          <div className="space-y-2 pt-3 border-t border-text-muted/15">
            <h3 className="text-xs font-bold font-heading uppercase text-text-muted tracking-wider px-2">
              Eco-Learning
            </h3>
            <div className="space-y-1">
              <Link
                to="/courses"
                onClick={onClose}
                className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Browse Masterclasses</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>

              <SignedIn>
                <Link
                  to="/my-world/courses"
                  onClick={onClose}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                    <span>My Enrolled Courses</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </SignedIn>
            </div>
          </div>

          {/* Section 3: Partner & Management Dashboards (Strictly Role Gated) */}
          <SignedIn>
            <div className="space-y-2 pt-3 border-t border-text-muted/15">
              <h3 className="text-xs font-bold font-heading uppercase text-text-muted tracking-wider px-2">
                Partner Centres
              </h3>
              <div className="space-y-1">
                {canAccessSellerCentre && (
                  <Link
                    to="/seller-centre"
                    onClick={onClose}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold bg-primary-light text-primary transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Briefcase className="w-3.5 h-3.5 text-primary" />
                      <span>Seller Centre</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-primary" />
                  </Link>
                )}

                {canAccessFarmerCentre && (
                  <Link
                    to="/farmer-centre"
                    onClick={onClose}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold bg-secondary-light text-secondary transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Sprout className="w-3.5 h-3.5 text-secondary" />
                      <span>Farmer Centre</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-secondary" />
                  </Link>
                )}

                {canAccessEducatorCentre && (
                  <Link
                    to="/educator-centre"
                    onClick={onClose}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold bg-accent/20 text-text-primary transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      <span>Educator Centre</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/onboarding"
                    onClick={onClose}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold bg-ai-light text-ai transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-ai" />
                      <span>Admin Onboarding</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-ai" />
                  </Link>
                )}

                {isCustomer && (
                  <Link
                    to="/apply"
                    onClick={onClose}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Sprout className="w-3.5 h-3.5 text-primary" />
                      <span>Become a Seller / Farmer</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                  </Link>
                )}
              </div>
            </div>
          </SignedIn>

          {/* Section 4: Customer Orders & Account */}
          <SignedIn>
            <div className="space-y-2 pt-3 border-t border-text-muted/15">
              <h3 className="text-xs font-bold font-heading uppercase text-text-muted tracking-wider px-2">
                Account & Orders
              </h3>
              <div className="space-y-1">
                <Link
                  to="/my-world/wishlist"
                  onClick={onClose}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Heart className="w-3.5 h-3.5 text-secondary" />
                    <span>Your Wishlist</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>

                <Link
                  to="/my-world/orders"
                  onClick={onClose}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Package className="w-3.5 h-3.5 text-primary" />
                    <span>Your Orders</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>

                <Link
                  to="/my-account"
                  onClick={onClose}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Account Settings</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                </Link>
              </div>
            </div>
          </SignedIn>

          {/* Section 5: Help & Legal Information */}
          <div className="space-y-2 pt-3 border-t border-text-muted/15">
            <h3 className="text-xs font-bold font-heading uppercase text-text-muted tracking-wider px-2">
              Help & Policy
            </h3>
            <div className="space-y-1">
              <Link
                to="/help"
                onClick={onClose}
                className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <HelpCircle className="w-3.5 h-3.5 text-secondary" />
                  <span>Help / FAQ Center</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>

              <Link
                to="/contact"
                onClick={onClose}
                className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Contact Support</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>

              <Link
                to="/privacy"
                onClick={onClose}
                className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Shield className="w-3.5 h-3.5 text-text-muted" />
                  <span>Privacy Policy</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>

              <Link
                to="/terms"
                onClick={onClose}
                className="w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-medium hover:bg-background-muted text-text-primary transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-text-muted" />
                  <span>Terms of Service</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
