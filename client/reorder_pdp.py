import re

with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'r') as f:
    content = f.read()

# Extract the similar items widget
similar_items_pattern = r"(\s*{/\* Similar Items Widget.*?}\)\s*}</span>.*?</div>\s*}\)\s*</div>\s*</div>\s*\}?)" # Wait, regex might be tricky. Let's just do line slicing safely.

lines = content.split('\n')

# Find start and end of Similar Items Widget
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "{/* Similar Items Widget" in line:
        start_idx = i
        break

if start_idx != -1:
    # Look for the closing bracket of the product.similarProducts condition
    # It ends before "</div>" and "{/* COLUMN 2"
    for i in range(start_idx, len(lines)):
        if "{/* COLUMN 2: CENTER TITLE" in lines[i]:
            # The closing div is before this. Let's find the exact end of similar items block
            end_idx = i - 2
            break

if start_idx != -1 and end_idx != -1:
    similar_items_block = lines[start_idx:end_idx+1]
    
    # Remove it from original position
    del lines[start_idx:end_idx+1]
    
    # Find the end of product-info section
    target_idx = -1
    for i, line in enumerate(lines):
        if "</section>" in line and "SECTION 3: REVIEWS" in '\n'.join(lines[i:i+5]):
            target_idx = i + 1
            break
            
    if target_idx != -1:
        # Wrap it in a section tag maybe? The prompt said "No content or styling changes" 
        # Actually it was in a narrow column before, if we move it to full width it will stretch.
        # But wait, the prompt says "No content or styling changes to either section - purely a reorder".
        lines.insert(target_idx, '\n'.join(similar_items_block))
        
        with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'w') as f:
            f.write('\n'.join(lines))
        print("Successfully reordered Similar Items in PDP")
    else:
        print("Target index not found")
else:
    print("Similar items block not found", start_idx, end_idx)

