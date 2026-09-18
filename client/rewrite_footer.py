import re

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'r') as f:
    content = f.read()

# Add ChevronDown
content = content.replace("Youtube }", "Youtube, ChevronDown }")

# Add state
if "const [openAccordion" not in content:
    content = content.replace("const currentYear =", """const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  const toggleAccordion = (section: string) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };
  
  const currentYear =""")

# Replace the grid content
grid_replacement = """        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-white/10 text-xs">
          {/* Column 1 — Get to Know Us */}
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
          </div>

          {/* Column 2 — Make Money with Us */}
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
          </div>

          {/* Column 4 — Let Us Help You */}
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
          </div>
        </div>"""

# Find the start and end of the original grid content
start_idx = content.find('<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')
end_idx = content.find('        {/* Regional Selector Bar')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + grid_replacement + "\n\n" + content[end_idx:]
    
with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'w') as f:
    f.write(content)
