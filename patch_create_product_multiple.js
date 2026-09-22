const fs = require('fs');
const path = 'server/src/modules/seller/sellerController.ts';
let content = fs.readFileSync(path, 'utf8');

// Find createProduct function and replace the destructuring and prisma create
content = content.replace(
  `const { name, description, price, category, image, videoUrl, quantity, isActive } = req.body;`,
  `const { name, description, price, category, image, images, videoUrl, quantity, isActive } = req.body;`
);

content = content.replace(
  `images: image ? [image] : [],
        videoUrl: videoUrl || null,`,
  `images: Array.isArray(images) && images.length > 0 ? images : (image ? [image] : []),
        videoUrl: videoUrl || null,`
);

content = content.replace(
  `image: newProduct.images[0] || null,
      videoUrl: newProduct.videoUrl,`,
  `images: newProduct.images,
      image: newProduct.images[0] || null,
      videoUrl: newProduct.videoUrl,`
);

fs.writeFileSync(path, content);
console.log("Patched sellerController.ts for multiple images");
