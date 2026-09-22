const fs = require('fs');
const path = 'server/src/modules/commerce/productController.ts';
let content = fs.readFileSync(path, 'utf8');

const regex = /const where: any = \{\};[\s\S]*?if \(query\.producerRole\) \{[\s\S]*?where\.seller = \{ role: query\.producerRole as Role \};\n    \}/;

const replacement = `const AND: any[] = [];

    if (query.category) {
      let normalizedCategory = query.category;
      const lower = query.category.toLowerCase();
      if (lower === 'organic produce') normalizedCategory = 'ORGANIC_PRODUCE';
      else if (lower === 'artisan crafts') normalizedCategory = 'ARTISAN_CRAFTS';
      else if (lower === 'eco living') normalizedCategory = 'ECO_LIVING';
      else if (lower === 'food & spices' || lower === 'food_spices') normalizedCategory = 'FOOD_SPICES';

      AND.push({
        OR: [
          { category: { equals: query.category, mode: 'insensitive' } },
          { category: { equals: normalizedCategory, mode: 'insensitive' } }
        ]
      });
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceFilter: any = {};
      if (query.minPrice !== undefined) priceFilter.gte = query.minPrice;
      if (query.maxPrice !== undefined) priceFilter.lte = query.maxPrice;
      AND.push({ price: priceFilter });
    }

    if (query.search) {
      AND.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ]
      });
    }

    if (query.sellerId) {
      AND.push({ sellerId: query.sellerId });
    } else {
      AND.push({ status: 'ACTIVE' });
    }

    if (query.producerRole) {
      AND.push({ seller: { role: query.producerRole as Role } });
    }

    const where = AND.length > 0 ? { AND } : {};`;

content = content.replace(regex, replacement);
fs.writeFileSync(path, content);
console.log("Successfully replaced where query logic!");
