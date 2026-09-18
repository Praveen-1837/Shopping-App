import re

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Add User import if missing
if "User," not in content and " User " not in content:
    content = content.replace("UserCheck,", "UserCheck,\n  User,")

# 5. Fix header outer container to prevent page horizontal scroll
content = content.replace(
    '<header className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 transition-all overflow-x-hidden">',
    '<header className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 transition-all overflow-x-hidden w-full">'
)

# Fix Left side (Hamburger & Logo)
old_left = """          <div className="flex items-center space-x-1 sm:space-x-4 shrink-0 min-w-0">
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
          </div>"""

new_left = """          <div className="flex items-center space-x-1 sm:space-x-4 shrink-0 min-w-0 flex-1">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1 sm:p-2 rounded-xl text-text-primary hover:bg-background-muted transition-colors cursor-pointer shrink-0"
              aria-label="Open side menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* EcoMarket Logo */}
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 group min-w-0 overflow-hidden">
              <div className="w-7 h-7 sm:w-auto sm:h-auto p-1 sm:p-1.5 bg-primary/10 rounded-full sm:rounded-xl group-hover:bg-primary/20 transition-colors overflow-hidden border border-primary/10 shrink-0 flex items-center justify-center">
                <img src={logo} alt="EcoMarket" className="h-full w-full sm:h-7 sm:w-auto object-contain" />
              </div>
              <span className="brand-wordmark text-[20px] sm:text-4xl text-primary leading-none select-none truncate shrink">
                EcoMarket
              </span>
              {isAdmin && (
                <span className="hidden sm:inline-block text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-bold font-body leading-normal ml-1">
                  Admin
                </span>
              )}
            </Link>
          </div>"""
content = content.replace(old_left, new_left)

# Fix Right Actions (Account & Cart)
old_right = """          {/* Right Action Icons: Account & Lists Dropdown + Shopping Cart */}
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
          </div>"""

new_right = """          {/* Right Action Icons: Account & Cart */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-4 shrink-0">
            {/* Desktop Amazon-Style Account Dropdown */}
            <div className="hidden md:block">
              <AccountListsDropdown />
            </div>

            {/* Mobile simple Account Icon */}
            <Link to={user ? "/my-account" : "/login"} className="md:hidden p-1.5 rounded-full text-text-primary hover:bg-background-muted flex items-center justify-center" aria-label="Account">
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
              <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-text-muted/20">
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
          </div>"""
content = content.replace(old_right, new_right)

# 4. Fix sub-nav tab strip
# Search for: <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth text-xs font-medium text-text-secondary pr-8 md:pr-0">
content = content.replace(
    'className="flex items-center space-x-2 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth text-xs font-medium text-text-secondary pr-8 md:pr-0"',
    'className="flex items-center space-x-2 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap scroll-smooth text-xs font-medium text-text-secondary pr-8 md:pr-0 w-full"'
)

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'w') as f:
    f.write(content)
