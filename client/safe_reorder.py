with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'r') as f:
    lines = f.read().split('\n')

start_idx = 750
end_idx = 784

similar_block = lines[start_idx:end_idx]

# Remove the block from original position
del lines[start_idx:end_idx]

# Now we need to find the line with "</section>" right before "SECTION 3: REVIEWS"
target_idx = -1
for i, line in enumerate(lines):
    if "SECTION 3: REVIEWS" in line:
        target_idx = i - 1 # Insert before the comment for SECTION 3
        break

if target_idx != -1:
    # Let's wrap it in a <section> to match the layout
    wrapped_block = [
        "",
        "        {/* SECTION 2.5: SIMILAR ITEMS (Moved from Top) */}",
        '        <section id="similar-items" className="scroll-mt-28 space-y-6">',
        '          <div className="border-b border-text-muted/15 pb-3">',
        '            <h2 className="text-2xl font-bold font-heading text-primary">Consider A Similar Item</h2>',
        '            <p className="text-xs text-text-secondary">Other products you might like</p>',
        '          </div>',
        '          <div className="bg-background-card rounded-3xl p-6 sm:p-8 border border-text-muted/15 shadow-soft">'
    ] + [
        line.replace('Consider A Similar Item', 'Similar Products') # Avoid double title
            .replace('grid-cols-2 sm:grid-cols-4', 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5') # Make it fit full width
        for line in similar_block
    ] + [
        "          </div>",
        "        </section>"
    ]
    
    lines = lines[:target_idx] + wrapped_block + lines[target_idx:]
    with open('/home/praveenshinde/Shopping app/client/src/pages/ProductDetail.tsx', 'w') as f:
        f.write('\n'.join(lines))
    print("Reordered successfully!")
else:
    print("Could not find SECTION 3")

