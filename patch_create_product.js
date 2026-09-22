const fs = require('fs');
const path = 'server/src/modules/seller/sellerController.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `const { name, description, price, category, image, quantity, isActive } = req.body;`,
  `const { name, description, price, category, image, videoUrl, quantity, isActive } = req.body;`
);

content = content.replace(
  `images: image ? [image] : [],`,
  `images: image ? [image] : [],
        videoUrl: videoUrl || null,`
);

content = content.replace(
  `image: newProduct.images[0] || null,`,
  `image: newProduct.images[0] || null,
      videoUrl: newProduct.videoUrl,`
);

fs.writeFileSync(path, content);
console.log("Patched createProduct");
