sed -i '/res.status(200).json({/i \
    const topCategories = Object.keys(categoryMap).map(cat => ({ name: cat, revenue: categoryMap[cat] })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);\
' server/src/modules/admin/adminController.ts
