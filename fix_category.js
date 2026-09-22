const fs = require('fs');
const path = 'server/src/modules/commerce/productController.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace: 
// if (query.category) {
//   where.category = { equals: query.category, mode: 'insensitive' };
// }
//
// With:
// if (query.category) {
//   // Map readable names to ENUM-like names (or vice versa) so both DB formats match
//   let normalizedCategory = query.category;
//   if (query.category.toLowerCase() === 'organic produce') normalizedCategory = 'ORGANIC_PRODUCE';
//   if (query.category.toLowerCase() === 'artisan crafts') normalizedCategory = 'ARTISAN_CRAFTS';
//   if (query.category.toLowerCase() === 'eco living') normalizedCategory = 'ECO_LIVING';
//   if (query.category.toLowerCase() === 'food & spices') normalizedCategory = 'FOOD_SPICES';
//
//   where.OR = [
//     { category: { equals: query.category, mode: 'insensitive' } },
//     { category: { equals: normalizedCategory, mode: 'insensitive' } }
//   ];
// }

const oldBlock = `    if (query.category) {
      where.category = { equals: query.category, mode: 'insensitive' };
    }`;

const newBlock = `    if (query.category) {
      let normalizedCategory = query.category;
      const lower = query.category.toLowerCase();
      if (lower === 'organic produce') normalizedCategory = 'ORGANIC_PRODUCE';
      else if (lower === 'artisan crafts') normalizedCategory = 'ARTISAN_CRAFTS';
      else if (lower === 'eco living') normalizedCategory = 'ECO_LIVING';
      else if (lower === 'food & spices' || lower === 'food_spices') normalizedCategory = 'FOOD_SPICES';

      where.OR = [
        ...(where.OR || []),
        { category: { equals: query.category, mode: 'insensitive' } },
        { category: { equals: normalizedCategory, mode: 'insensitive' } }
      ];
    }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content);
console.log("Patched getProducts backend");
