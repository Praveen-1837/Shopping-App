import re

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Make sure header has overflow-x-hidden (it already does, but let's ensure it doesn't break sticky)
content = content.replace(
    '<header className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 transition-all overflow-x-hidden">',
    '<header className="bg-background-card border-b border-text-muted/10 sticky top-0 z-40 transition-all overflow-x-hidden w-full">'
)

# Replace the entire top row
top_row_pattern = re.compile(r'<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-6">.*?<form\n\s*onSubmit=\{handleSearchSubmit\}', re.DOTALL)

new_top_row = """<div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-between gap-1 sm:gap-4 w-full">
          {/* Left: Hamburger & Logo */}
          <div className="flex items-center space-x-1 sm:space-x-4 min-w-0 flex-1">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1 sm:p-2 rounded-xl text-text-primary hover:bg-background-muted transition-colors cursor-pointer shrink-0"
              aria-label="Open side menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* EcoMarket Logo */}
            <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 group min-w-0 overflow-hidden">
              <div className="w-7 h-7 sm:w-auto sm:h-auto p-1 sm:p-1.5 bg-primary/10 rounded-full sm:rounded-xl group-hover:bg-primary/20 transition-colors border border-primary/10 shrink-0 flex items-center justify-center">
                <img src={logo} alt="EcoMarket" className="h-full w-full sm:h-7 sm:w-auto object-contain" />
              </div>
              <span className="brand-wordmark text-[18px] sm:text-4xl text-primary leading-none select-none truncate">
                EcoMarket
              </span>
              {isAdmin && (
                <span className="hidden sm:inline-block text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-bold font-body leading-normal ml-1">
                  Admin
                </span>
              )}
            </Link>
          </div>

          {/* Right Action Icons: Cart & Account */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-4 shrink-0">
            {/* Desktop Amazon-Style Account Dropdown */}
            <div className="hidden md:block">
              <AccountListsDropdown />
            </div>

            {/* Mobile simple Cart Icon */}
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

            {/* Mobile simple Account Icon */}
            <Link to={user ? "/my-account" : "/login"} className="md:hidden p-1.5 rounded-full text-text-primary hover:bg-background-muted flex items-center justify-center" aria-label="Account">
               <User className="w-5 h-5 text-primary" />
            </Link>

            {/* Clerk User Avatar (when signed in) - Desktop Only */}
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
          </div>
        </div>

        {/* Center: Integrated Amazon-Style Search Bar (Desktop Only) */}
        <form
          onSubmit={handleSearchSubmit}"""

content = top_row_pattern.sub(new_top_row, content)

# Remove the old Right Action Icons block that was AFTER the search bar
old_right_actions_pattern = re.compile(r'\{\/\* Right Action Icons: Account & Cart \*\/\}.*?<\/div>\n\s*<\/div>', re.DOTALL)
content = old_right_actions_pattern.sub('</div>', content)

with open('/home/praveenshinde/Shopping app/client/src/components/Navbar.tsx', 'w') as f:
    f.write(content)
