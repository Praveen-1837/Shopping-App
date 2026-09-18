import re

with open('/home/praveenshinde/Shopping app/client/src/components/ProductCard.tsx', 'r') as f:
    content = f.read()

# Update padding and spacing in Details
content = content.replace(
    'className="p-2.5 sm:p-3.5 space-y-1.5"',
    'className="p-2 sm:p-3 space-y-1 sm:space-y-1.5"'
)

# Update padding and spacing in Footer
content = content.replace(
    'className="p-2.5 sm:p-3.5 pt-2 flex items-center justify-between border-t border-text-muted/10 mt-1 bg-background-muted/30"',
    'className="p-2 sm:p-3 pt-1.5 sm:pt-2 flex items-center justify-between border-t border-text-muted/10 mt-0.5 bg-background-muted/30"'
)

# Let's also check if title text-xs is small enough.
content = content.replace(
    'text-xs sm:text-sm text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug',
    'text-[11px] sm:text-sm text-text-primary group-hover:text-primary transition-colors line-clamp-2 leading-snug'
)

# And the price size
content = content.replace(
    'text-xs sm:text-base md:text-lg font-extrabold font-heading text-primary',
    'text-[11px] sm:text-base md:text-lg font-extrabold font-heading text-primary'
)

with open('/home/praveenshinde/Shopping app/client/src/components/ProductCard.tsx', 'w') as f:
    f.write(content)
