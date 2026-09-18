import re

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Make sure User is imported
if 'User,' not in content and 'User ' not in content:
    content = content.replace("UserCheck,", "UserCheck, User,")
if 'User,' not in content and 'User }' not in content:
    content = content.replace("Menu,", "Menu, User,")

# Split at return (
parts = content.split('  return (\n    <>\n')
if len(parts) == 2:
    logic = parts[0]
else:
    print("Failed to split content")
    exit(1)

new_jsx = """  return (
    <>
      <header className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 transition-all overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-6">
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center space-x-1 sm:space-x-4 shrink-0 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1 sm:p-2 rounded-xl text-text-primary hover:bg-background-muted transition-colors cursor-pointer shrink-0"
              aria-label="Open side menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* EcoMarket Logo */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 group min-w-0">
              <div className="p-1 sm:p-1.5 bg-primary/10 rounded-lg sm:rounded-xl group-hover:bg-primary/20 transition-colors overflow-hidden border border-primary/10 shrink-0">
                <img src={logo} alt="EcoMarket" className="h-5 sm:h-7 w-auto object-contain" />
              </div>
              <span className="brand-wordmark text-[22px] sm:text-4xl text-primary leading-none select-none truncate">
                EcoMarket
              </span>
              {isAdmin && (
                <span className="hidden sm:inline-block text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-bold font-body leading-normal ml-1">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Center: Integrated Amazon-Style Search Bar (Desktop Only) */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-2xl hidden md:flex items-center bg-background-muted/80 border border-text-muted/20 rounded-xl overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/40 transition-all mx-4"
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

          {/* Right Action Icons: Account & Cart */}
          <div className="flex items-center space-x-1 sm:space-x-4 shrink-0">
            {/* Desktop Amazon-Style Account Dropdown */}
            <div className="hidden md:block">
              <AccountListsDropdown />
            </div>

            {/* Mobile simple Account Icon (Links to My Account if signed in, or Sign In) */}
            <Link to={isSignedIn ? "/my-account" : "/login"} className="md:hidden p-1.5 rounded-full text-text-primary hover:bg-background-muted flex items-center justify-center">
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

            {/* Clerk User Avatar (when signed in) - Desktop Only */}
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

        {/* Mobile Search Row (visible on md and below) */}
        <div className="px-2 pb-2 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center bg-background-muted/80 border border-text-muted/20 rounded-lg overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-primary/40 transition-all"
          >
            <input
              type="text"
              placeholder="Search products..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="flex-1 px-3 py-1.5 text-[11px] sm:text-xs bg-transparent text-text-primary focus:outline-none placeholder:text-text-muted"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="px-3 py-1.5 bg-primary text-white hover:bg-primary-hover transition-colors flex items-center justify-center cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Secondary Category Shortcuts Tier */}
        <div className="bg-background-muted/50 border-t border-text-muted/10 py-1.5 relative w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 relative after:pointer-events-none after:absolute after:right-0 after:top-0 after:bottom-0 after:w-8 after:bg-gradient-to-l after:from-background-card/90 after:to-transparent">
            {/* The scrollable container */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap scroll-smooth text-xs font-medium text-text-secondary pr-8 w-full pb-0.5">
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
"""

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'w') as f:
    f.write(logic + "  return (\n    <>\n" + new_jsx)

