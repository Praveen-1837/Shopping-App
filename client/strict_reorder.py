with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'r') as f:
    lines = f.read().split('\n')

start_idx = 750 # Line 751 (0-indexed 750)
end_idx = 784   # Line 784 (0-indexed 783)

similar_block = lines[start_idx:end_idx]

# Remove the block from original position
del lines[start_idx:end_idx]

# Find "</section>" before "SECTION 3: REVIEWS"
target_idx = -1
for i, line in enumerate(lines):
    if "SECTION 3: REVIEWS" in line:
        target_idx = i - 1 
        break

if target_idx != -1:
    lines = lines[:target_idx] + similar_block + lines[target_idx:]
    with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'w') as f:
        f.write('\n'.join(lines))
    print("Strict reorder successful!")
else:
    print("Could not find target")

