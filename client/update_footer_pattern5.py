import re

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'r') as f:
    content = f.read()

# Replace state and toggleAccordion logic since it's no longer an accordion
content = re.sub(r'const \[openAccordion, setOpenAccordion\].*?};', '', content, flags=re.DOTALL)

# Replace the grid container.
old_grid = 'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-white/10 text-xs"'
new_grid = 'className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 py-6 sm:py-8 border-b border-white/10 text-xs"'
content = content.replace(old_grid, new_grid)

# Replace the columns (Remove accordion logic, add text-[12px], space-y-1.5)
# Column 1
content = re.sub(
    r'<div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">\s*<button.*?<span>Get to Know Us</span>.*?</button>\s*<ul className={`space-y-1\.5 sm:space-y-2 text-\[\#B0C2B3\].*?`}>',
    '<div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">\n            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">\n              Get to Know Us\n            </h3>\n            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">',
    content, flags=re.DOTALL
)

# Column 2
content = re.sub(
    r'<div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">\s*<button.*?<span>Make Money with Us</span>.*?</button>\s*<ul className={`space-y-1\.5 sm:space-y-2 text-\[\#B0C2B3\].*?`}>',
    '<div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">\n            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">\n              Make Money with Us\n            </h3>\n            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">',
    content, flags=re.DOTALL
)

# Column 3
content = re.sub(
    r'<div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">\s*<button.*?<span>Eco-Learning & Features</span>.*?</button>\s*<ul className={`space-y-1\.5 sm:space-y-2 text-\[\#B0C2B3\].*?`}>',
    '<div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">\n            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">\n              Eco-Learning\n            </h3>\n            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">',
    content, flags=re.DOTALL
)

# Column 4
content = re.sub(
    r'<div className="space-y-2 sm:space-y-3 border-b sm:border-b-0 border-white/10 pb-3 sm:pb-0">\s*<button.*?<span>Let Us Help You</span>.*?</button>\s*<ul className={`space-y-1\.5 sm:space-y-2 text-\[\#B0C2B3\].*?`}>',
    '<div className="space-y-2 sm:space-y-3 pb-2 sm:pb-0">\n            <h3 className="font-heading font-bold text-[10px] sm:text-sm text-primary sm:text-white uppercase tracking-wider">\n              Let Us Help You\n            </h3>\n            <ul className="space-y-1.5 sm:space-y-2 text-[#B0C2B3] text-[11px] sm:text-xs">',
    content, flags=re.DOTALL
)

# "Regional Selector Bar" -> Compact single row on mobile? No, the user said:
# "a compact bottom bar (small logo + copyright, single row, no wrapping) — no forced full mobile-width stacking that inflates height. Then a single row of small circular social icon buttons."
# Currently, the Logo is in Regional Selectors. And Copyright + Social is below.
# Let's combine Logo + Copyright into one row, then Social row, then Selectors below or hide Selectors on mobile (or put them in a row).
# The prompt: "thin divider, then a compact bottom bar (small logo + copyright, single row, no wrapping)... Then a single row of small circular social icon buttons."

regional_selector_pattern = re.compile(r'\{\/\* Regional Selector Bar \(Logo \+ Dropdown Selectors\) \*\/\}.*?<\/footer>', re.DOTALL)
new_footer_bottom = """{/* Compact Bottom Bar (Logo + Copyright) */}
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
    </footer>"""

content = regional_selector_pattern.sub(new_footer_bottom, content)

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'w') as f:
    f.write(content)
