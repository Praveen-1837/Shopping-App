import re

with open('/home/praveenshinde/Shopping app/client/src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Update grid layout
old_grid = 'className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"'
new_grid = 'className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4"'
content = content.replace(old_grid, new_grid)

with open('/home/praveenshinde/Shopping app/client/src/pages/Home.tsx', 'w') as f:
    f.write(content)
