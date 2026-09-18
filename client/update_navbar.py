import re

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Make the main header wrapper sticky with a shadow
content = content.replace('className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 transition-all"', 'className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 shadow-sm transition-all"')

# Replace the top flex container and search logic
main_flex_pattern = re.compile(r'<div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2\.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">.*?</div>\n\n\s*\{\/\* Mobile Search Row', re.DOTALL)

replacement = """<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-12 sm:h-auto py-0 sm:py-3 flex items-center justify-between gap-2 sm:gap-6">
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl text-text-primary hover:bg-background-muted transition-colors cursor-pointer"
              aria-label="Open side menu"
            >
              <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
            </button>

            {/* EcoMarket Logo */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 group">
              <div className="p-1 sm:p-1.5 bg-primary/10 rounded-lg sm:rounded-xl group-hover:bg-primary/20 transition-colors overflow-hidden border border-primary/10">
                <img src={logo} alt="EcoMarket" className="h-5 sm:h-7 w-auto object-contain" />
              </div>
              <span className="brand-wordmark font-praise text-lg sm:text-2xl text-primary tracking-normal leading-none hidden sm:block md:hidden lg:block">
                EcoMarket
              </span>
            </Link>
          </div>

          {/* Middle: Search Box (Responsive: Compact icon-only or flex on mobile, full width on desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl flex items-center bg-background-muted/80 border border-text-muted/20 rounded-full sm:rounded-xl overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40 transition-all h-8 sm:h-auto"
          >
            {/* Desktop Category Selector */}
            <div className="hidden sm:flex relative items-center border-r border-text-muted/20 bg-background-muted hover:bg-background-muted/80 transition-colors shrink-0">
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
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="flex-1 px-3 py-1 sm:py-2 text-[11px] sm:text-xs bg-transparent text-text-primary focus:outline-none placeholder:text-text-muted"
            />

            {/* Search Submit Button */}
            <button
              type="submit"
              aria-label="Submit search"
              className="px-2.5 sm:px-4 py-1 sm:py-2 bg-primary text-white hover:bg-primary-hover transition-colors flex items-center justify-center cursor-pointer shrink-0 h-full"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1 sm:space-x-4 shrink-0">
            {/* Desktop Amazon-Style Account Dropdown (hidden on mobile, replaced by simple icon if needed) */}
            <div className="hidden sm:block">
              <AccountListsDropdown />
            </div>
            {/* Mobile simple Account Icon (Links to My Account if signed in, or Sign In) */}
            <Link to={isSignedIn ? "/my-account" : "/login"} className="sm:hidden p-1.5 rounded-full text-text-primary hover:bg-background-muted flex items-center justify-center">
               <User className="w-5 h-5 text-primary" />
            </Link>

            {/* Shopping Cart Link */}
            <Link
              to="/cart"
              className="relative p-1.5 sm:p-2 rounded-full sm:rounded-xl text-text-primary hover:bg-background-muted hover:text-primary transition-colors flex items-center justify-center"
              aria-label="View Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-primary" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-0 sm:-right-1 bg-secondary text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-soft animate-scale-in">
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

        {/* Mobile Search Row"""

content = main_flex_pattern.sub(replacement, content)

# Remove the Mobile Search Row (since it's now inline on mobile)
mobile_search_row_pattern = re.compile(r'\{\/\* Mobile Search Row \(visible on small screens\) \*\/\}.*?<\/div>\n\n\s*\{\/\* Secondary Category Shortcuts', re.DOTALL)
content = mobile_search_row_pattern.sub('{/* Secondary Category Shortcuts', content)

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'w') as f:
    f.write(content)
