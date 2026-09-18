import re

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'r') as f:
    content = f.read()

# Add useState import if not present
if "import { useState" not in content:
    content = content.replace("import { Link, useLocation } from 'react-router-dom';", "import { useState } from 'react';\nimport { Link, useLocation } from 'react-router-dom';")

# Add ChevronDown import from lucide-react
if "ChevronDown" not in content:
    content = content.replace("Youtube,", "Youtube,\n  ChevronDown,")

# Add state to Footer component
state_code = """export default function Footer() {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };
"""
content = content.replace("export default function Footer() {", state_code)

# Replace Column 1
col1_pattern = re.compile(r'\{\/\* Column 1 — Get to Know Us \*\/.*?<\/div>\n\s*<\/div>', re.DOTALL)
col1_replacement = """{/* Column 1 — Get to Know Us */}
          <div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">
            <button 
              onClick={() => toggleAccordion('about')}
              className="w-full flex items-center justify-between sm:pointer-events-none font-heading font-bold text-sm text-white uppercase tracking-wider"
            >
              <span>Get to Know Us</span>
              <ChevronDown className={`w-4 h-4 sm:hidden transition-transform ${openAccordion === 'about' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-1.5 sm:space-y-2 text-[#B0C2B3] overflow-hidden transition-all sm:!max-h-none sm:!opacity-100 ${openAccordion === 'about' ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 sm:mt-3'}`}>
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
          </div>"""
content = col1_pattern.sub(col1_replacement, content)

# Replace Column 2
col2_pattern = re.compile(r'\{\/\* Column 2 — Make Money with Us \*\/.*?<\/div>\n\s*<\/div>', re.DOTALL)
col2_replacement = """{/* Column 2 — Make Money with Us */}
          <div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">
            <button 
              onClick={() => toggleAccordion('money')}
              className="w-full flex items-center justify-between sm:pointer-events-none font-heading font-bold text-sm text-white uppercase tracking-wider"
            >
              <span>Make Money with Us</span>
              <ChevronDown className={`w-4 h-4 sm:hidden transition-transform ${openAccordion === 'money' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-1.5 sm:space-y-2 text-[#B0C2B3] overflow-hidden transition-all sm:!max-h-none sm:!opacity-100 ${openAccordion === 'money' ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 sm:mt-3'}`}>
              {!isAdmin && (
                <>
                  <li>
                    <Link to="/apply/seller" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Sell Your Eco-Products
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply/farmer" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Sell Directly as a Farmer
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply/artisan" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Sell as an Artisan / Craftsman
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply/educator" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Teach a Masterclass
                    </Link>
                  </li>
                  <li>
                    <Link to="/apply/delivery" className="block py-1 sm:py-0 hover:text-accent hover:underline transition-colors">
                      Become a Delivery Partner
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>"""
content = col2_pattern.sub(col2_replacement, content)

# Replace Column 3
col3_pattern = re.compile(r'\{\/\* Column 3 — Eco-Learning & Features \*\/.*?<\/div>', re.DOTALL)
col3_replacement = """{/* Column 3 — Eco-Learning & Features */}
          <div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">
            <button 
              onClick={() => toggleAccordion('learning')}
              className="w-full flex items-center justify-between sm:pointer-events-none font-heading font-bold text-sm text-white uppercase tracking-wider"
            >
              <span>Eco-Learning & Features</span>
              <ChevronDown className={`w-4 h-4 sm:hidden transition-transform ${openAccordion === 'learning' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-1.5 sm:space-y-2 text-[#B0C2B3] overflow-hidden transition-all sm:!max-h-none sm:!opacity-100 ${openAccordion === 'learning' ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 sm:mt-3'}`}>
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
          </div>"""
content = col3_pattern.sub(col3_replacement, content)

# Replace Column 4
col4_pattern = re.compile(r'\{\/\* Column 4 — Let Us Help You \*\/.*?<\/div>', re.DOTALL)
col4_replacement = """{/* Column 4 — Let Us Help You */}
          <div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">
            <button 
              onClick={() => toggleAccordion('help')}
              className="w-full flex items-center justify-between sm:pointer-events-none font-heading font-bold text-sm text-white uppercase tracking-wider"
            >
              <span>Let Us Help You</span>
              <ChevronDown className={`w-4 h-4 sm:hidden transition-transform ${openAccordion === 'help' ? 'rotate-180' : ''}`} />
            </button>
            <ul className={`space-y-1.5 sm:space-y-2 text-[#B0C2B3] overflow-hidden transition-all sm:!max-h-none sm:!opacity-100 ${openAccordion === 'help' ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0 sm:mt-3'}`}>
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
          </div>"""
content = col4_pattern.sub(col4_replacement, content)

# Change grid-cols-2 to grid-cols-1 on mobile
content = content.replace('grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pb-8 sm:pb-12 border-b border-white/10', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 md:gap-12 pb-6 sm:pb-12 border-b border-white/10')

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'w') as f:
    f.write(content)
