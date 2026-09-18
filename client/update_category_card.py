import re

with open('/home/praveenshinde/Shopping app/client/src/components/CategoryPreviewCard.tsx', 'r') as f:
    content = f.read()

# Make the outer container small on mobile, large on sm+
content = content.replace(
    'className="relative z-10 w-full bg-white dark:bg-background-card border border-text-muted/15 rounded-3xl p-5 shadow-card hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full space-y-4 group cursor-pointer select-none"',
    'className="relative z-10 w-full bg-white dark:bg-background-card border border-text-muted/15 rounded-xl sm:rounded-3xl p-2 sm:p-5 shadow-sm sm:shadow-card hover:shadow-md sm:hover:shadow-2xl hover:border-primary/40 hover:-translate-y-0.5 sm:hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-stretch sm:justify-between h-full gap-1 sm:gap-0 sm:space-y-4 group cursor-pointer select-none text-center sm:text-left"'
)

# Header: on mobile it becomes an emoji + 2-line title.
header_replacement = """{/* Category Heading (Clickable target) */}
      <div
        onClick={handleCardClick}
        className="flex flex-col sm:flex-row items-center sm:justify-between cursor-pointer w-full"
        title={`Explore ${category}`}
      >
        <span className="p-2 sm:p-1.5 bg-primary-light/50 sm:bg-primary-light text-primary rounded-full sm:rounded-xl shrink-0 group-hover:bg-primary group-hover:text-white transition-colors mb-1 sm:mb-0">
          <Sprout className="w-5 h-5 sm:w-4 sm:h-4" />
        </span>
        <h3 className="font-heading font-bold sm:font-extrabold text-[10px] leading-tight sm:text-sm md:text-base text-text-primary tracking-tight group-hover:text-primary transition-colors line-clamp-2 sm:line-clamp-none break-words w-full">
          {category}
        </h3>
        <span className="hidden sm:hidden text-[9px] text-text-muted mt-0.5">{items.length} items</span>
      </div>"""
content = re.sub(r'\{\/\* Category Heading.*?<\/div>', header_replacement, content, flags=re.DOTALL)

# Hide 2x2 Quadrant on mobile
content = content.replace(
    'className="grid grid-cols-2 gap-3 aspect-square w-full rounded-2xl overflow-hidden bg-background-muted/40 p-2 border border-text-muted/10 cursor-pointer"',
    'className="hidden sm:grid grid-cols-2 gap-3 aspect-square w-full rounded-2xl overflow-hidden bg-background-muted/40 p-2 border border-text-muted/10 cursor-pointer"'
)

# Hide Footer Link Action on mobile
content = content.replace(
    'className="flex items-center justify-between text-xs sm:text-sm font-bold text-primary group-hover:text-primary-hover pt-1 cursor-pointer"',
    'className="hidden sm:flex items-center justify-between text-xs sm:text-sm font-bold text-primary group-hover:text-primary-hover pt-1 cursor-pointer"'
)

with open('/home/praveenshinde/Shopping app/client/src/components/CategoryPreviewCard.tsx', 'w') as f:
    f.write(content)

with open('/home/praveenshinde/Shopping app/client/src/pages/Home.tsx', 'r') as f:
    home_content = f.read()
home_content = home_content.replace('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch', 'grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 items-stretch')
with open('/home/praveenshinde/Shopping app/client/src/pages/Home.tsx', 'w') as f:
    f.write(home_content)
