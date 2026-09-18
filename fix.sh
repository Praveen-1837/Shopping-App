sed -i 's/item.product.categoryId/item.product.category/g' server/src/modules/admin/adminController.ts
sed -i 's/const categoryIds = Object.keys(categoryMap);/const topCategories = Object.keys(categoryMap).map(cat => ({ name: cat, revenue: categoryMap[cat] })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);/' server/src/modules/admin/adminController.ts
sed -i '/const categories = await prisma.category.findMany/d' server/src/modules/admin/adminController.ts
sed -i '/where: { id: { in: categoryIds } }/d' server/src/modules/admin/adminController.ts
sed -i '/const topCategories = categories.map(c => ({/d' server/src/modules/admin/adminController.ts
sed -i '/name: c.name,/d' server/src/modules/admin/adminController.ts
sed -i '/revenue: categoryMap\[c.id\]/d' server/src/modules/admin/adminController.ts
sed -i '/})).sort((a, b) => b.revenue - a.revenue).slice(0, 5);/d' server/src/modules/admin/adminController.ts
sed -i 's/(value: number) =>/(value: any) =>/g' client/src/pages/AdminDashboard.tsx
