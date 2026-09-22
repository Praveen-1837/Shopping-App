const fs = require('fs');
const path = 'server/src/modules/seller/sellerRoutes.ts';
let content = fs.readFileSync(path, 'utf8');

// Update imports
content = content.replace(
  `createProduct,
  getSellerOrders,
} from './sellerController';`,
  `createProduct,
  getSellerOrders,
  getSellerProducts,
  deleteSellerProduct,
} from './sellerController';`
);

// Add routes
content = content.replace(
  `export default router;`,
  `router.get('/seller/products', roleGuard([...SELLER_ROLES]), getSellerProducts);
router.delete('/seller/product/:id', roleGuard([...SELLER_ROLES]), deleteSellerProduct);

export default router;`
);

fs.writeFileSync(path, content);
console.log("Patched sellerRoutes.ts");
