import re

with open('/home/praveenshinde/Shopping app/client/src/components/HeroBannerCarousel.tsx', 'r') as f:
    content = f.read()

# Remove 'Featured' eyebrow
featured_block = """                <span className="text-[9px] sm:text-sm font-bold uppercase tracking-wider text-secondary">
                  Featured
                </span>"""
content = content.replace(featured_block, "")

# Remove 'Shop Now' button
shop_now_block = """                <button className="mt-1 sm:mt-4 px-3 py-1 sm:px-5 sm:py-2.5 bg-secondary text-white text-[9px] sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-secondary/90 transition-colors flex items-center space-x-1 cursor-pointer">
                  <span>Shop Now</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                </button>"""
content = content.replace(shop_now_block, "")

with open('/home/praveenshinde/Shopping app/client/src/components/HeroBannerCarousel.tsx', 'w') as f:
    f.write(content)

print("Removed elements from HeroBannerCarousel")
