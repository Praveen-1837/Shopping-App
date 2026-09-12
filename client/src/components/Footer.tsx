import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Globe, IndianRupee, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { useUserRole } from '../hooks/useUserRole';
import logo from '../assets/logo.png';

export default function Footer() {
  const { isSeller, isFarmer, isArtisan, isEducator, isAdmin, isCustomer, isDeliveryPartner } = useUserRole();
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-b border-white/10 text-xs">
          {/* Column 1 — Get to Know Us */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              Get to Know Us
            </h3>
            <ul className="space-y-2 text-[#B0C2B3]">
              <li>
                <Link to="/about" className="hover:text-accent hover:underline transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-accent hover:underline transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent hover:underline transition-colors">
                  Our Sustainability Mission
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 — Partner with Us */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              Partner with Us
            </h3>
            <ul className="space-y-2 text-[#B0C2B3]">
              {isAdmin ? (
                <>
                  <li>
                    <Link to="/seller-centre" className="hover:text-accent hover:underline transition-colors">
                      Go to Seller Centre
                    </Link>
                  </li>
                  <li>
                    <Link to="/farmer-centre" className="hover:text-accent hover:underline transition-colors">
                      Go to Farmer Centre
                    </Link>
                  </li>
                  <li>
                    <Link to="/educator-centre" className="hover:text-accent hover:underline transition-colors">
                      Go to Educator Centre
                    </Link>
                  </li>
                  <li>
                    <Link to="/delivery-centre" className="hover:text-accent hover:underline transition-colors">
                      Go to Delivery Centre
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/onboarding" className="hover:text-accent hover:underline transition-colors">
                      Go to Admin Onboarding
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  {/* Seller / Farmer / Artisan CTA or Dashboard Link */}
                  <li>
                    {isSeller || isArtisan ? (
                      <Link to="/seller-centre" className="hover:text-accent hover:underline transition-colors">
                        Go to Seller Centre
                      </Link>
                    ) : isFarmer ? (
                      <Link to="/farmer-centre" className="hover:text-accent hover:underline transition-colors">
                        Go to Farmer Centre
                      </Link>
                    ) : (
                      <Link to="/apply?role=seller" className="hover:text-accent hover:underline transition-colors">
                        Become a Seller
                      </Link>
                    )}
                  </li>

                  {/* Educator CTA or Dashboard Link */}
                  <li>
                    {isEducator ? (
                      <Link to="/educator-centre" className="hover:text-accent hover:underline transition-colors">
                        Go to Educator Centre
                      </Link>
                    ) : (
                      <Link to="/apply?role=educator" className="hover:text-accent hover:underline transition-colors">
                        Become an Educator
                      </Link>
                    )}
                  </li>

                  {/* Delivery Partner CTA or Dashboard Link */}
                  <li>
                    {isDeliveryPartner ? (
                      <Link to="/delivery-centre" className="hover:text-accent hover:underline transition-colors">
                        Go to Delivery Centre
                      </Link>
                    ) : (
                      <Link to="/apply?role=delivery_partner" className="hover:text-accent hover:underline transition-colors">
                        Become a Delivery Partner
                      </Link>
                    )}
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3 — Eco-Learning & Features */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              Eco-Learning & Features
            </h3>
            <ul className="space-y-2 text-[#B0C2B3]">
              <li>
                <Link to="/courses" className="hover:text-accent hover:underline transition-colors">
                  Browse Masterclasses
                </Link>
              </li>
              <li>
                <Link to="/my-world/courses" className="hover:text-accent hover:underline transition-colors">
                  My Enrolled Courses
                </Link>
              </li>
              <li>
                <span className="text-[#B0C2B3]/70 cursor-default">
                  Verified Producer Traceability
                </span>
              </li>
              <li>
                <span className="text-[#B0C2B3]/70 cursor-default">
                  Eco-Points & Rewards (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4 — Let Us Help You */}
          <div className="space-y-3">
            <h3 className="font-heading font-bold text-sm text-white uppercase tracking-wider">
              Let Us Help You
            </h3>
            <ul className="space-y-2 text-[#B0C2B3]">
              <li>
                <Link to="/my-account" className="hover:text-accent hover:underline transition-colors">
                  Your Account Settings
                </Link>
              </li>
              <li>
                <Link to="/my-world/orders" className="hover:text-accent hover:underline transition-colors">
                  Your Orders & Fulfillment
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-accent hover:underline transition-colors">
                  Help / FAQ Center
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-accent hover:underline transition-colors">
                  Returns & Exchange Policy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent hover:underline transition-colors">
                  Contact Support Options
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-accent hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-accent hover:underline transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Regional Selector Bar (Logo + Dropdown Selectors) */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/10">
          {/* Platform Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-2.5 group">
            <div className="p-1 bg-white rounded-xl group-hover:scale-105 transition-transform overflow-hidden shadow-xs border border-white/20">
              <img src={logo} alt="EcoMarket" className="h-9 w-auto max-w-[130px] object-contain" />
            </div>
            <span className="brand-wordmark font-praise text-2xl sm:text-3xl tracking-normal text-white leading-none select-none">
              EcoMarket
            </span>
          </Link>

          {/* Dropdown-Style Selectors Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {/* Language Selector */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#27422B] border border-white/15 rounded-lg">
              <Globe className="w-3.5 h-3.5 text-secondary" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="English" className="bg-[#1B2E1E]">English</option>
                <option value="Hindi" className="bg-[#1B2E1E]">Hindi (हिंदी)</option>
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#27422B] border border-white/15 rounded-lg">
              <IndianRupee className="w-3.5 h-3.5 text-secondary" />
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="INR - Indian Rupee (₹)" className="bg-[#1B2E1E]">INR - Indian Rupee (₹)</option>
                <option value="USD - US Dollar ($)" className="bg-[#1B2E1E]">USD - US Dollar ($)</option>
              </select>
            </div>

            {/* Country Selector */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#27422B] border border-white/15 rounded-lg">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="India" className="bg-[#1B2E1E]">🇮🇳 India</option>
                <option value="United States" className="bg-[#1B2E1E]">🇺🇸 United States</option>
                <option value="United Kingdom" className="bg-[#1B2E1E]">🇬🇧 United Kingdom</option>
                <option value="Singapore" className="bg-[#1B2E1E]">🇸🇬 Singapore</option>
                <option value="Australia" className="bg-[#1B2E1E]">🇦🇺 Australia</option>
              </select>
            </div>
          </div>
        </div>

        {/* Compact Single-Row Bottom Bar: Copyright & Social Icons */}
        <div className="pt-4 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B0C2B3]">
          <div>
            © {currentYear} EcoMarket Inc. All rights reserved.
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="#"
              aria-label="Instagram"
              className="p-2 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="p-2 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="p-2 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="p-2 rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary transition-colors"
            >
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
