import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Globe, IndianRupee, Instagram, Facebook, Twitter, Youtube, ChevronDown } from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';
import logo from '../assets/logo.png';

export default function Footer() {
  const { hasAnyPartnerRole, isSeller, isFarmer, isArtisan, isEducator, isAdmin, isCustomer, isDeliveryPartner } = useUserRole();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('INR - Indian Rupee (₹)');
  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  
  
  const currentYear = new Date().getFullYear();

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAdmin) {
    return (
      <footer className="mt-16 bg-[#1B2E1E] text-white font-body py-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#B0C2B3]">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-md p-0.5 overflow-hidden">
              <img src={logo} alt="EcoMarket" className="h-5 w-auto object-contain" />
            </div>
            <span className="brand-wordmark font-praise text-xl text-white leading-none select-none">EcoMarket</span>
            <span className="font-heading font-extrabold text-white">Admin Operations Portal</span>
            <span>— Operations Mode</span>
          </div>
          <div>© {new Date().getFullYear()} EcoMarket Inc. All rights reserved.</div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-16 bg-[#1B2E1E] text-white font-body">
      {/* Top Strip: Back to Top Button */}
      <button
        onClick={handleBackToTop}
        aria-label="Back to top"
        className="w-full py-3 bg-[#27422B] hover:bg-[#315236] text-[#FAF7F2] text-[12px] font-bold tracking-wider uppercase text-center transition-colors cursor-pointer block border-b border-white/10"
      >
        Back to top
      </button>

      {/* Main Footer Body — 4 Column Amazon Pattern */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-white/10 text-xs">
          {/* Column 1 — Get to Know Us */}
          <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">
            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">
              Get to Know Us
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">
              <li>
                <Link to="/about" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  About EcoMarket
                </Link>
              </li>
              <li>
                <Link to="/careers" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Careers & Culture
                </Link>
              </li>
              <li>
                <span className="block py-1 sm:py-0 text-[#B0C2B3]/70 cursor-default">
                  Sustainability Reports
                </span>
              </li>
              <li>
                <span className="block py-1 sm:py-0 text-[#B0C2B3]/70 cursor-default">
                  Press Releases
                </span>
              </li>
              <li>
                <span className="block py-1 sm:py-0 text-[#B0C2B3]/70 cursor-default">
                  Science & Research (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2 — Make Money with Us */}
          <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">
            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">
              Make Money with Us
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">
              {!hasAnyPartnerRole && (
                <>
                  <li>
                    <Link to="/apply?role=seller" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Sell Your Eco-Products
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply?role=farmer" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Sell Directly as a Farmer
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply?role=artisan" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Sell as an Artisan / Craftsman
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply?role=educator" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Teach a Masterclass
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply?role=delivery_partner" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Become a Delivery Partner
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3 — Eco-Learning & Features */}
          <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">
            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">
              Eco-Learning
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">
              <li>
                <Link to="/courses" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Browse Masterclasses
                </Link>
              </li>
              <li>
                <Link to="/my-world/courses" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  My Enrolled Courses
                </Link>
              </li>
              <li>
                <span className="block py-1 sm:py-0 text-[#B0C2B3]/70 cursor-default">
                  Verified Producer Traceability
                </span>
              </li>
              <li>
                <span className="block py-1 sm:py-0 text-[#B0C2B3]/70 cursor-default">
                  Eco-Points & Rewards (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4 — Let Us Help You */}
          <div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">
            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">
              Let Us Help You
            </h3>
            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">
              <li>
                <Link to="/my-account" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Your Account Settings
                </Link>
              </li>
              <li>
                <Link to="/my-world/orders" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Your Orders & Fulfillment
                </Link>
              </li>
              <li>
                <Link to="/help" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Help / FAQ Center
                </Link>
              </li>
              <li>
                <Link to="/returns" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Returns & Exchange Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Contact Support Options
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compact Bottom Bar (Logo + Copyright) */}
        <div className="pt-5 pb-3 flex items-center justify-between gap-2 text-[10px] sm:text-xs text-[#B0C2B3]">
          <Link to="/" className="flex items-center space-x-1 sm:space-x-2 group shrink-0">
            <div className="p-0.5 sm:p-1 bg-white/10 rounded-md sm:rounded-xl group-hover:bg-white/20 transition-colors">
              <img src={logo} alt="EcoMarket" className="h-4 sm:h-9 w-auto object-contain" />
            </div>
            <span className="brand-wordmark font-praise text-sm sm:text-3xl text-white leading-none">
              EcoMarket
            </span>
          </Link>
          <div className="truncate text-right">
            © {currentYear} EcoMarket Inc. All rights.
          </div>
        </div>

        {/* Social Icons Row */}
        <div className="pb-6 flex items-center justify-center sm:justify-end space-x-3">
          <a href="#" aria-label="Instagram" className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors">
            <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
          <a href="#" aria-label="Facebook" className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors">
            <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
          <a href="#" aria-label="Twitter" className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors">
            <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
          <a href="#" aria-label="YouTube" className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors">
            <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
