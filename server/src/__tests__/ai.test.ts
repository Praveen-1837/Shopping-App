import request from 'supertest';
import {
  detectIntent,
  formatAIResponse,
  findSimilarItems,
  mapQueryToCategory,
  handleUserQuery,
} from '../modules/ai/aiController';
import { prisma } from '../config/db';

jest.mock('../modules/auth/webhookController', () => ({
  handleClerkWebhook: (_req: any, res: any) => res.status(200).send('OK'),
}));

jest.mock('../modules/ai/scripts/generateEmbeddings', () => ({
  getEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.01)),
}));

import app from '../app';

describe('AI Assistant Content Filtering & Response Formatting', () => {
  describe('Intent Detection (Change 1)', () => {
    it('should detect PRODUCT intent for "Show me organic products"', () => {
      expect(detectIntent('Show me organic products')).toBe('PRODUCT');
      expect(detectIntent('I want to buy artisan items')).toBe('PRODUCT');
      expect(detectIntent('organic produce available')).toBe('PRODUCT');
    });

    it('should detect COURSE intent for "I want to learn kitchen gardening"', () => {
      expect(detectIntent('I want to learn kitchen gardening')).toBe('COURSE');
      expect(detectIntent('Show me masterclasses on composting')).toBe('COURSE');
      expect(detectIntent('farming course tutorials')).toBe('COURSE');
    });

    it('should detect MIXED intent when query mentions both or general topics', () => {
      expect(detectIntent('Do you have organic products or courses?')).toBe('MIXED');
      expect(detectIntent('What can you tell me about sustainability?')).toBe('MIXED');
    });
  });

  describe('Response Formatting (Change 2 & 3)', () => {
    it('should convert bold markdown to plain text and asterisks to proper bullet points (•)', () => {
      const rawGeminiResponse = `Here are your recommendations:
* **Organic Tomatoes** - ₹80
* **Fresh Spinach** - ₹40`;

      const formatted = formatAIResponse(rawGeminiResponse);

      expect(formatted).toContain('• Organic Tomatoes - ₹80');
      expect(formatted).toContain('• Fresh Spinach - ₹40');
      expect(formatted).not.toContain('**');
      expect(formatted).not.toMatch(/^\* /m);
    });

    it('should convert italic markdown asterisks and preserve clean styling without *item* or *Bamboo seeds*', () => {
      const rawText = `* **Bamboo seeds** (Eco Product) — **₹150**
*Bamboo seeds* are sustainably harvested.
*item* description here`;

      const formatted = formatAIResponse(rawText);

      // Verify YES: • Bamboo seeds (Eco Product) — ₹150
      expect(formatted).toContain('• Bamboo seeds (Eco Product) — ₹150');
      // Verify NO: *Bamboo seeds* or *item*
      expect(formatted).not.toContain('*Bamboo seeds*');
      expect(formatted).not.toContain('*item*');
      expect(formatted).toContain('Bamboo seeds are sustainably harvested.');
      expect(formatted).toContain('item description here');
    });

    it('should clean up multiple spaces and trim empty lines', () => {
      const messyText = `   • Item 1   —    ₹100   \n\n\n   • Item 2   —    ₹200   `;
      const formatted = formatAIResponse(messyText);

      expect(formatted).toBe('• Item 1 — ₹100\n• Item 2 — ₹200');
    });
  });

  describe('Content-Type Filtering & Semantic Result Isolation (Change 4)', () => {
    it('should return ONLY products (no courses) when querying with PRODUCT intent', async () => {
      const mockProducts = [
        { id: 'prod-1', title: 'Organic Spinach', description: 'Fresh organic greens', price: 40, category: 'ORGANIC_PRODUCE', stock: 10 },
        { id: 'prod-2', title: 'Bamboo Toothbrush', description: 'Eco friendly brush', price: 90, category: 'ECO_LIVING', stock: 25 },
      ];

      jest.spyOn(prisma, '$queryRawUnsafe').mockImplementation((async (sql: string) => {
        if (sql.includes('"Product"')) {
          return mockProducts.map((p) => ({ ...p, type: 'PRODUCT', contentType: 'PRODUCT', distance: 0.1 }));
        }
        if (sql.includes('"Course"')) {
          return [
            { id: 'course-1', title: 'Crash course on Kitchen Gardening', description: 'Learn gardening', price: 499, category: 'Gardening', durationMins: 60, type: 'COURSE', contentType: 'COURSE', distance: 0.05 },
          ];
        }
        return [];
      }) as any);

      const results = await findSimilarItems('Show me organic products', 6, 'PRODUCT');

      // Verify that every returned item is a PRODUCT and no COURSE is present
      expect(results.length).toBeGreaterThan(0);
      results.forEach((item) => {
        expect(item.type).toBe('PRODUCT');
        expect(item.contentType).toBe('PRODUCT');
        expect(item.title).not.toContain('Crash course');
      });
    });

    it('should return ONLY courses (no products) when querying with COURSE intent', async () => {
      jest.spyOn(prisma, '$queryRawUnsafe').mockImplementation((async (sql: string) => {
        if (sql.includes('"Course"')) {
          return [
            { id: 'course-1', title: 'Crash course on Kitchen Gardening', description: 'Learn gardening', price: 499, category: 'Gardening', durationMins: 60, type: 'COURSE', contentType: 'COURSE', distance: 0.05 },
          ];
        }
        if (sql.includes('"Product"')) {
          return [
            { id: 'prod-1', title: 'Organic Spinach', description: 'Fresh organic greens', price: 40, category: 'ORGANIC_PRODUCE', stock: 10, type: 'PRODUCT', contentType: 'PRODUCT', distance: 0.1 },
          ];
        }
        return [];
      }) as any);

      const results = await findSimilarItems('I want to learn kitchen gardening', 6, 'COURSE');

      expect(results.length).toBeGreaterThan(0);
      results.forEach((item) => {
        expect(item.type).toBe('COURSE');
        expect(item.contentType).toBe('COURSE');
        expect(item.title).not.toContain('Spinach');
      });
    });
  });

  describe('AI Semantic Search Endpoint (/api/v1/ai/search)', () => {
    it('should return filtered products for product query via API', async () => {
      jest.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([
        { id: 'prod-1', title: 'Organic Apples', description: 'Fresh crisp apples', price: 120, category: 'ORGANIC_PRODUCE', stock: 15, type: 'PRODUCT', contentType: 'PRODUCT', distance: 0.1 },
      ]);

      const res = await request(app).get('/api/v1/ai/search?q=organic%20products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('PRODUCT');
      expect(res.body.data[0].type).toBe('PRODUCT');
      expect(res.body.data[0].contentType).toBe('PRODUCT');
    });

    it('should return filtered courses for course query via API', async () => {
      jest.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([
        { id: 'course-1', title: 'Permaculture Masterclass', description: 'Learn permaculture', price: 899, category: 'Farming', durationMins: 120, type: 'COURSE', contentType: 'COURSE', distance: 0.1 },
      ]);

      const res = await request(app).get('/api/v1/ai/search?q=learn%20kitchen%20gardening');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.intent).toBe('COURSE');
      expect(res.body.data[0].type).toBe('COURSE');
      expect(res.body.data[0].contentType).toBe('COURSE');
    });
  });

  describe('Category Mapping (mapQueryToCategory)', () => {
    it('should map organic produce keywords to ORGANIC_PRODUCE', () => {
      expect(mapQueryToCategory('help me with organic products')).toBe('ORGANIC_PRODUCE');
      expect(mapQueryToCategory('fresh vegetable seeds')).toBe('ORGANIC_PRODUCE');
      expect(mapQueryToCategory('seasonal fruits and grains')).toBe('ORGANIC_PRODUCE');
    });

    it('should map artisan keywords to ARTISAN_CRAFTS', () => {
      expect(mapQueryToCategory('show me handmade crafts')).toBe('ARTISAN_CRAFTS');
      expect(mapQueryToCategory('artisan pottery decor')).toBe('ARTISAN_CRAFTS');
      expect(mapQueryToCategory('woven textile bag')).toBe('ARTISAN_CRAFTS');
    });

    it('should map eco living keywords to ECO_LIVING', () => {
      expect(mapQueryToCategory('eco living reusable bamboo')).toBe('ECO_LIVING');
      expect(mapQueryToCategory('zero waste sustainable cleaner')).toBe('ECO_LIVING');
    });

    it('should map food and spice keywords to FOOD_SPICES', () => {
      expect(mapQueryToCategory('tea, spices and food')).toBe('FOOD_SPICES');
      expect(mapQueryToCategory('pure honey and coffee')).toBe('FOOD_SPICES');
    });

    it('should return null for mixed or general queries without category keywords', () => {
      expect(mapQueryToCategory('what do you have?')).toBeNull();
      expect(mapQueryToCategory('hello there')).toBeNull();
    });
  });

  describe('Direct Database Category Query (handleUserQuery)', () => {
    it('should query Product table directly by category when category intent detected', async () => {
      const mockCategoryProducts = [
        { id: 'prod-10', title: 'Bamboo seeds', price: 150, category: 'ORGANIC_PRODUCE', stock: 20, images: ['img1.jpg'], seller: { name: 'EcoFarmer' } },
        { id: 'prod-11', title: 'Organic Compost', price: 200, category: 'ORGANIC_PRODUCE', stock: 15, images: ['img2.jpg'], seller: { name: 'GreenEarth' } },
        { id: 'prod-12', title: 'Heirloom Seeds', price: 120, category: 'ORGANIC_PRODUCE', stock: 50, images: ['img3.jpg'], seller: { name: 'SeedBank' } },
      ];

      const findManySpy = jest.spyOn(prisma.product, 'findMany').mockResolvedValue(mockCategoryProducts as any);

      const result = await handleUserQuery('help me with organic products');

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { category: { equals: 'ORGANIC_PRODUCE', mode: 'insensitive' } },
            ]),
            stock: { gt: 0 },
          }),
        })
      );

      expect(result.data.length).toBe(3);
      expect(result.data[0].category).toBe('ORGANIC_PRODUCE');
      expect(result.message).toContain('Based on our verified sustainable catalog, here are top recommended items matching your request:');
      expect(result.message).toContain('• Bamboo seeds (ORGANIC_PRODUCE) — ₹150');
      expect(result.message).toContain('• Organic Compost (ORGANIC_PRODUCE) — ₹200');
      expect(result.message).toContain('• Heirloom Seeds (ORGANIC_PRODUCE) — ₹120');

      findManySpy.mockRestore();
    });

    it('should fallback to semantic search when no category is matched', async () => {
      jest.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue([
        { id: 'prod-1', title: 'General Eco Bag', description: 'Durable bag', price: 250, category: 'ECO_LIVING', stock: 10, type: 'PRODUCT', contentType: 'PRODUCT', distance: 0.1 },
      ]);

      const result = await handleUserQuery('what do you have?');
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.message).toContain('• General Eco Bag (ECO_LIVING) — ₹250');
    });
  });

  describe('Explicit Category Search Endpoint (/api/v1/ai/category-search)', () => {
    it('should return category-filtered products for category queries', async () => {
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue([
        { id: 'craft-1', title: 'Clay Ceramic Cup', price: 300, category: 'ARTISAN_CRAFTS', stock: 12, images: [], seller: { name: 'CraftMaker' } },
      ] as any);

      const res = await request(app).get('/api/v1/ai/category-search?q=show%20me%20handmade%20crafts');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Top 1 artisan crafts products:');
      expect(res.body.message).toContain('• Clay Ceramic Cup — ₹300');
      expect(res.body.data[0].category).toBe('ARTISAN_CRAFTS');
    });

    it('should prompt user to specify category when query lacks category keywords', async () => {
      const res = await request(app).get('/api/v1/ai/category-search?q=what%20is%20trending');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Please specify a product type (organic, artisan, eco, spices)');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health check cleanly', async () => {
      const response = await request(app).get('/api/v1/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
