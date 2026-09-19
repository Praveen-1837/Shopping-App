import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useClerk, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axios';
import { useUserRole } from '../hooks/useUserRole';
import {
  ChevronDown,
  User,
  Package,
  GraduationCap,
  Briefcase,
  Sprout,
  Award,
  ShieldCheck,
  LogOut,
  LogIn,
  BookOpen,
  Heart,
} from 'lucide-react';

export default function AccountListsDropdown() {
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { canAccessSellerCentre, canAccessFarmerCentre, canAccessEducatorCentre, isAdmin, isCustomer } = useUserRole();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  // Query wishlist count
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

  const wishlistCount = wishlistData?.data?.items?.length || 0;

  // Hover handlers for smooth desktop interactions
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape keypress for Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block text-left"
    >
      {/* Nav Item Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center space-x-1 p-1.5 rounded-xl hover:bg-background-muted transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted leading-tight">
            {user ? `Hello, ${user.firstName || 'Customer'}` : 'Hello, sign in'}
          </span>
          <span className="font-bold text-sm text-text-primary flex items-center space-x-0.5 leading-tight">
            <span>Account & Lists</span>
            <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {/* Dropdown Panel Container */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-72 sm:w-80 bg-background-card rounded-2xl border border-text-muted/15 shadow-card z-50 p-5 space-y-4 animate-scale-in text-sm">
          <SignedOut>
            {/* Signed Out View: Sign In Call-to-Action */}
            <div className="text-center space-y-3 pb-3 border-b border-text-muted/15">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <div className="text-[11px] text-text-muted">
                New customer?{' '}
                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="text-primary font-bold hover:underline"
                >
                  Start here.
                </Link>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            {/* Signed In View: 2-Column Structure */}
            <div className="grid grid-cols-2 gap-4 border-b border-text-muted/15 pb-4">
              {/* Column 1: Your Lists (Genuinely Wishlist) */}
              <div className="space-y-2 border-r border-text-muted/15 pr-3">
                <h4 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider">
                  Your Lists
                </h4>
                <ul className="space-y-2 text-text-secondary">
                  <li>
                    <Link
                      to="/my-world/wishlist"
                      onClick={() => setIsOpen(false)}
                      className="hover:text-primary hover:underline flex items-center justify-between font-semibold text-secondary transition-colors"
                    >
                      <span className="flex items-center space-x-1.5">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>Your Wishlist</span>
                      </span>
                      {wishlistCount > 0 && (
                        <span className="bg-secondary-light text-secondary px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/my-world/courses"
                      onClick={() => setIsOpen(false)}
                      className="hover:text-primary hover:underline flex items-center space-x-1.5 transition-colors"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>My Learning</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/courses"
                      onClick={() => setIsOpen(false)}
                      className="hover:text-primary hover:underline flex items-center space-x-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Masterclasses</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Your Account */}
              <div className="space-y-2 pl-1">
                <h4 className="font-heading font-bold text-sm text-text-primary uppercase tracking-wider">
                  Your Account
                </h4>
                <ul className="space-y-2 text-text-secondary">
                  <li>
                    <Link
                      to="/my-account"
                      onClick={() => setIsOpen(false)}
                      className="hover:text-primary hover:underline flex items-center space-x-1.5 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Account Profile</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/my-world/orders"
                      onClick={() => setIsOpen(false)}
                      className="hover:text-primary hover:underline flex items-center space-x-1.5 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Your Orders</span>
                    </Link>
                  </li>

                  {/* Role Dashboard Shortcuts strictly gated */}
                  {canAccessSellerCentre && (
                    <li>
                      <Link
                        to="/seller-centre"
                        onClick={() => setIsOpen(false)}
                        className="hover:text-primary hover:underline flex items-center space-x-1.5 font-bold text-primary transition-colors"
                      >
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span>Seller Centre</span>
                      </Link>
                    </li>
                  )}

                  {canAccessFarmerCentre && (
                    <li>
                      <Link
                        to="/farmer-centre"
                        onClick={() => setIsOpen(false)}
                        className="hover:text-primary hover:underline flex items-center space-x-1.5 font-bold text-secondary transition-colors"
                      >
                        <Sprout className="w-3.5 h-3.5 shrink-0" />
                        <span>Farmer Centre</span>
                      </Link>
                    </li>
                  )}

                  {canAccessEducatorCentre && (
                    <li>
                      <Link
                        to="/educator-centre"
                        onClick={() => setIsOpen(false)}
                        className="hover:text-primary hover:underline flex items-center space-x-1.5 font-bold text-accent transition-colors"
                      >
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Educator Centre</span>
                      </Link>
                    </li>
                  )}

                  {isAdmin && (
                    <li>
                      <Link
                        to="/admin/onboarding"
                        onClick={() => setIsOpen(false)}
                        className="hover:text-primary hover:underline flex items-center space-x-1.5 font-bold text-ai transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Onboarding</span>
                      </Link>
                    </li>
                  )}

                  {isCustomer && (
                    <li>
                      <Link
                        to="/apply"
                        onClick={() => setIsOpen(false)}
                        className="hover:text-primary hover:underline flex items-center space-x-1.5 transition-colors"
                      >
                        <Sprout className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Become Partner</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Sign Out Button Footer */}
            <div className="pt-1 text-right">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center space-x-1.5 text-sm text-error font-semibold hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </SignedIn>
        </div>
      )}
    </div>
  );
}
