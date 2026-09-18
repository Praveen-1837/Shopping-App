import re

with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'r') as f:
    content = f.read()

# 1. Extract Similar Items Widget
widget_pattern = re.compile(
    r'(?P<widget>[ \t]*\{\/\* Similar Items Widget \*\/.*?\}\)\}\n[ \t]*<\/div>\n[ \t]*<\/div>\n[ \t]*\)\}\n)',
    re.DOTALL
)

match = widget_pattern.search(content)
if not match:
    print("Could not find Similar Items Widget")
    exit(1)

widget_code = match.group('widget')

# Remove the widget from its current location
content = content.replace(widget_code, '')

# Change the grid classes for a 1x3 vertical block
# Instead of `grid-cols-2 sm:grid-cols-4`, we want it to be `grid-cols-1 gap-4` (or `grid-cols-2 lg:grid-cols-1` if we want 2 cols on mobile)
# The prompt says "1x3 vertical stack or column layout" under the main product image. 
# Also, we should slice it to 3 items.
widget_code_updated = widget_code.replace(
    'className="grid grid-cols-2 sm:grid-cols-4 gap-3"',
    'className="grid grid-cols-1 gap-3"'
).replace(
    '{product.similarProducts.map((item) => (',
    '{product.similarProducts.slice(0, 3).map((item) => ('
).replace(
    '<SparklesIcon className="w-4 h-4 text-primary" />',
    '<SparklesIcon className="w-3.5 h-3.5 text-primary" />'
).replace(
    'Consider A Similar Item',
    'Consider a Similar Item'
)

# 2. Insert the widget into Column 1
# Find the end of column 1
# Column 1 looks like:
#               </div>
#             </div>
#
#             {/* COLUMN 2: CENTER TITLE & PRODUCT INFORMATION COLUMN (5 Cols) */}
col1_end_pattern = re.compile(
    r'(\n[ \t]*<\/div>\n[ \t]*<\/div>\n)(\n[ \t]*\{\/\* COLUMN 2)'
)

match = col1_end_pattern.search(content)
if not match:
    print("Could not find Column 1 end")
    exit(1)

# we want to insert inside the outer div, so just before `</div>\n\n  {/* COLUMN 2`
# Actually, let's inject it right after the flex div ends.
# The `match.group(1)` is `\n              </div>\n            </div>\n`. We want to insert before the last `</div>`.
insertion = f'\n{widget_code_updated}            </div>\n'
# Replace `</div>\n            </div>\n` with `</div>\n{widget_code_updated}            </div>\n`
new_content = content.replace(
    match.group(1),
    match.group(1).replace('            </div>\n', f'{widget_code_updated}            </div>\n', 1)
)

# 3. Clean up "Product Information & Safety Notes" container
# Remove the Legal Disclaimer box completely.
disclaimer_pattern = re.compile(
    r'[ \t]*\{\/\* 5\. Centralized Platform Legal Disclaimer.*?<\/div>\n[ \t]*<\/div>\n',
    re.DOTALL
)
new_content = disclaimer_pattern.sub('', new_content)

# Clean up expanded Product Description
# Instead of `bg-background-muted/40 p-5 rounded-2xl border border-text-muted/10`, let's make it a clean typography block without the box.
new_content = new_content.replace(
    'className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-background-muted/40 p-5 rounded-2xl border border-text-muted/10"',
    'className="text-sm text-text-secondary leading-relaxed whitespace-pre-line"'
).replace(
    'className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed whitespace-pre-line bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20"',
    'className="text-sm text-amber-900/90 dark:text-amber-200/90 leading-relaxed whitespace-pre-line"'
).replace(
    # for ingredients if it exists
    'className="text-xs text-text-secondary leading-relaxed whitespace-pre-line bg-background-muted/40 p-5 rounded-2xl border border-text-muted/10"',
    'className="text-sm text-text-secondary leading-relaxed whitespace-pre-line"'
)

with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'w') as f:
    f.write(new_content)

print("Update complete")
