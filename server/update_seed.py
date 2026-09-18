import re

with open('/home/praveenshinde/Shopping app/server/prisma/seed.ts', 'r') as f:
    content = f.read()

# Replace single image array with 3 images for the first one
content = content.replace(
    "images: [\n        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',\n      ],",
    "images: [\n        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800',\n        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',\n        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'\n      ],"
)

# And for the second one
content = content.replace(
    "images: [\n        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',\n      ],",
    "images: [\n        'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',\n        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',\n        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'\n      ],"
)

with open('/home/praveenshinde/Shopping app/server/prisma/seed.ts', 'w') as f:
    f.write(content)
