import re

with open('/home/praveenshinde/Shopping app/client/src/components/HeroBannerCarousel.tsx', 'r') as f:
    content = f.read()

# Add ArrowRight to imports if needed
if "ArrowRight" not in content:
    content = content.replace("ChevronRight } from 'lucide-react';", "ChevronRight, ArrowRight } from 'lucide-react';")

# 1. Update the main section container classes
content = content.replace(
    'className="relative w-full overflow-hidden transition-all group bg-[#112415] rounded-t-2xl sm:rounded-t-3xl"',
    'className="relative w-full overflow-hidden transition-all group bg-[#112415] rounded-xl sm:rounded-3xl mx-auto my-2 sm:my-0 max-w-[calc(100%-16px)] sm:max-w-full"'
)

# 2. Update individual slide containers (height and layout)
content = content.replace(
    'className="relative min-w-full h-[320px] sm:h-[400px] md:h-[500px] shrink-0 bg-black overflow-hidden"',
    'className="relative min-w-full h-36 sm:h-[400px] md:h-[500px] shrink-0 bg-black overflow-hidden"'
)

# 3. Update Gradient
content = content.replace(
    '<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />\n            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent pointer-events-none" />',
    '<div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent sm:from-black/80 sm:via-black/30 pointer-events-none" />\n            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:from-black/60 pointer-events-none" />'
)

# 4. Update the text box (Eyebrow + Heading + CTA)
old_text_box = """<div className="absolute inset-x-0 bottom-10 sm:bottom-12 md:bottom-16 px-4 sm:px-10 md:px-16 flex flex-col items-start z-10 pointer-events-none">
              <div className="max-w-full md:max-w-3xl space-y-2 sm:space-y-4">
                <h2 className="text-xl sm:text-3xl md:text-5xl font-black font-heading text-white leading-tight tracking-tight text-balance break-words">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-xs sm:text-base md:text-lg text-gray-200 font-medium text-balance break-words max-w-full">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>"""

new_text_box = """<div className="absolute inset-x-0 top-1/2 -translate-y-1/2 sm:top-auto sm:translate-y-0 sm:bottom-12 md:bottom-16 px-4 sm:px-10 md:px-16 flex flex-col items-start z-10 pointer-events-auto">
              <div className="max-w-[75%] sm:max-w-full md:max-w-3xl space-y-1 sm:space-y-4">
                <span className="text-[9px] sm:text-sm font-bold uppercase tracking-wider text-secondary">
                  Featured
                </span>
                <h2 className="text-sm sm:text-3xl md:text-5xl font-black font-heading text-white leading-tight tracking-tight text-balance break-words line-clamp-2">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="hidden sm:block text-xs sm:text-base md:text-lg text-gray-200 font-medium text-balance break-words max-w-full">
                    {banner.subtitle}
                  </p>
                )}
                <button className="mt-1 sm:mt-4 px-3 py-1 sm:px-5 sm:py-2.5 bg-secondary text-white text-[9px] sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-secondary/90 transition-colors flex items-center space-x-1 cursor-pointer">
                  <span>Shop Now</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>"""
content = content.replace(old_text_box, new_text_box)

# 5. Update dots position to bottom-right on mobile
content = content.replace(
    'className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 sm:space-x-2.5 pointer-events-auto bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm"',
    'className="absolute bottom-2 right-2 sm:bottom-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-30 flex items-center space-x-1.5 sm:space-x-2.5 pointer-events-auto bg-black/30 sm:bg-black/30 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full backdrop-blur-sm"'
)

with open('/home/praveenshinde/Shopping app/client/src/components/HeroBannerCarousel.tsx', 'w') as f:
    f.write(content)
