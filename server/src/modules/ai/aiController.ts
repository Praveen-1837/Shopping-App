import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEmbedding } from './scripts/generateEmbeddings';

async function getDbUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        name: 'User',
        email: `${clerkId}@example.com`,
        role: Role.CUSTOMER,
      },
    });
  }
  return user;
}

// Map user keywords to database category enum
export const mapQueryToCategory = (query: string): string | null => {
  const lowerQuery = query.toLowerCase();

  const categoryMap: Record<string, string[]> = {
    ORGANIC_PRODUCE: ['organic', 'vegetable', 'fruit', 'produce', 'seed', 'grains'],
    ARTISAN_CRAFTS: ['artisan', 'craft', 'handmade', 'pottery', 'textile', 'art', 'decor', 'weaving', 'candle'],
    ECO_LIVING: ['eco', 'sustainable', 'eco-living', 'reusable', 'green', 'bamboo', 'compost', 'bottle', 'cleaner', 'living'],
    FOOD_SPICES: ['food', 'spice', 'tea', 'coffee', 'honey', 'snack', 'spices', 'ghee', 'pickle', 'oil', 'herb'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lowerQuery.includes(kw))) {
      return category;
    }
  }

  return null; // Mixed/general query
};

export const categoryDisplayMap: Record<string, string> = {
  ORGANIC_PRODUCE: 'Organic Produce',
  ARTISAN_CRAFTS: 'Artisan Crafts',
  ECO_LIVING: 'Eco Living',
  FOOD_SPICES: 'Food & Spices',
};

// Detect user intent from query keywords
export const detectIntent = (query: string): 'PRODUCT' | 'COURSE' | 'MIXED' => {
  const lowerQuery = query.toLowerCase();

  const productKeywords = ['product', 'produce', 'item', 'buy', 'purchase', 'available', 'organic', 'artisan'];
  const courseKeywords = ['course', 'learn', 'class', 'masterclass', 'lesson', 'training', 'tutorial'];

  const hasProduct = productKeywords.some((kw) => lowerQuery.includes(kw));
  const hasCourse = courseKeywords.some((kw) => lowerQuery.includes(kw));

  if (hasProduct && !hasCourse) return 'PRODUCT';
  if (hasCourse && !hasProduct) return 'COURSE';
  return 'MIXED';
};

// Format Gemini markdown response into proper UI text
export const formatAIResponse = (rawResponse: string): string => {
  return rawResponse
    // Convert bold markdown to plain text (remove ** markers)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Remove italic markdown asterisks
    .replace(/\*([^*\n]+)\*/g, '$1')
    // Remove italic markdown underscores
    .replace(/_([^_\n]+)_/g, '$1')
    // Convert asterisk bullets to proper bullet points
    .replace(/^\* /gm, '• ')
    // Convert hyphen bullets to proper bullet points
    .replace(/^- /gm, '• ')
    // Clean up multiple spaces
    .replace(/  +/g, ' ')
    // Trim each line
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
};

const SYSTEM_PROMPT = `You are EcoMarket's AI Shopping Assistant.

When a user asks for products in a specific category:
1. DO NOT search broadly - search specifically for that category
2. Return ONLY products from the requested category
3. Format as a numbered or bullet list with prices in ₹
4. If no products found, offer to search a related category

Category Reference:
- "organic" → Search ORGANIC_PRODUCE category
- "artisan" or "craft" → Search ARTISAN_CRAFTS category
- "eco" or "sustainable" → Search ECO_LIVING category
- "food" or "spices" → Search FOOD_SPICES category

Response Format:
- Product Name (Category) — ₹Price

Do NOT use markdown asterisks or bold formatting.
Use proper bullet points (•) for lists.
Keep descriptions brief and scannable.

STRICT GROUNDING RULES:
1. You MUST NEVER invent, fabricate, or recommend products/courses that are not in the catalog context.
2. If no items in context match the user query, state honestly that no relevant catalog items were found.
3. Be friendly, conversational, helpful, and concise.`;

export async function findSimilarItems(
  queryText: string,
  limit = 6,
  filterType: 'PRODUCT' | 'COURSE' | 'MIXED' = 'MIXED'
) {
  const queryVector = await getEmbedding(queryText);
  const vectorStr = `[${queryVector.join(',')}]`;

  let productMatches: any[] = [];
  let courseMatches: any[] = [];

  // Query vector similarity for products if needed
  if (filterType === 'PRODUCT' || filterType === 'MIXED') {
    productMatches = await prisma.$queryRawUnsafe(
      `SELECT p.id, p.title, p.description, p.price, p.category, p.stock, 'PRODUCT' as type, 'PRODUCT' as "contentType",
              (pe.embedding <=> $1::vector) as distance
       FROM "Product" p
       JOIN "ProductEmbedding" pe ON p.id = pe."productId"
       ORDER BY distance ASC
       LIMIT $2`,
      vectorStr,
      limit
    );
  }

  // Query vector similarity for courses if needed
  if (filterType === 'COURSE' || filterType === 'MIXED') {
    courseMatches = await prisma.$queryRawUnsafe(
      `SELECT c.id, c.title, c.description, c.price, c.category, c."durationMins", 'COURSE' as type, 'COURSE' as "contentType",
              (ce.embedding <=> $1::vector) as distance
       FROM "Course" c
       JOIN "CourseEmbedding" ce ON c.id = ce."courseId"
       ORDER BY distance ASC
       LIMIT $2`,
      vectorStr,
      limit
    );
  }

  let items = [...productMatches, ...courseMatches];

  if (items.length === 0) {
    if (filterType === 'PRODUCT') {
      const allProducts = await prisma.product.findMany({ take: limit });
      items = allProducts.map((p) => ({ ...p, type: 'PRODUCT', contentType: 'PRODUCT' }));
    } else if (filterType === 'COURSE') {
      const allCourses = await prisma.course.findMany({ take: limit });
      items = allCourses.map((c) => ({ ...c, type: 'COURSE', contentType: 'COURSE' }));
    } else {
      const [allProducts, allCourses] = await Promise.all([
        prisma.product.findMany({ take: 5 }),
        prisma.course.findMany({ take: 5 }),
      ]);
      items = [
        ...allProducts.map((p) => ({ ...p, type: 'PRODUCT', contentType: 'PRODUCT' })),
        ...allCourses.map((c) => ({ ...c, type: 'COURSE', contentType: 'COURSE' })),
      ];
    }
  }

  // Deduplicate items by unique ID
  const seenIds = new Set<string>();
  const uniqueItems = items.filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  // Apply explicit type filtering to guarantee no cross-pollution
  let filtered = uniqueItems;
  if (filterType === 'PRODUCT') {
    filtered = uniqueItems.filter((i) => i.type === 'PRODUCT' || i.type === 'product' || i.contentType === 'PRODUCT');
  } else if (filterType === 'COURSE') {
    filtered = uniqueItems.filter((i) => i.type === 'COURSE' || i.type === 'course' || i.contentType === 'COURSE');
  }

  return filtered.slice(0, limit);
}

// Add to cart helper leveraging existing Cart JSON structure
async function executeAddToCart(userId: string, itemsToAdd: { id: string; type: 'PRODUCT' | 'COURSE'; quantity: number }[]) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  let currentItems: any[] = (cart?.items as any[]) || [];

  for (const newItem of itemsToAdd) {
    if (newItem.type === 'COURSE') {
      const course = await prisma.course.findUnique({ where: { id: newItem.id } });
      if (course) {
        const existingIdx = currentItems.findIndex(
          (i) => i.courseId === course.id || (i.type === 'COURSE' && i.productId === course.id)
        );
        if (existingIdx >= 0) {
          currentItems[existingIdx].quantity += newItem.quantity || 1;
        } else {
          currentItems.push({
            courseId: course.id,
            productId: course.id,
            type: 'COURSE',
            itemType: 'COURSE',
            quantity: newItem.quantity || 1,
            title: course.title,
            price: Number(course.price),
            image: course.previewVideo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
            category: course.category,
          });
        }
      }
    } else {
      const product = await prisma.product.findUnique({ where: { id: newItem.id } });
      if (product) {
        const existingIdx = currentItems.findIndex(
          (i) => i.productId === product.id && (i.type === 'PRODUCT' || !i.type)
        );
        if (existingIdx >= 0) {
          currentItems[existingIdx].quantity += newItem.quantity || 1;
        } else {
          currentItems.push({
            productId: product.id,
            type: 'PRODUCT',
            itemType: 'PRODUCT',
            quantity: newItem.quantity || 1,
            title: product.title,
            price: Number(product.price),
            image: product.images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800',
            category: product.category,
          });
        }
      }
    }
  }

  if (!cart) {
    await prisma.cart.create({
      data: {
        userId,
        items: currentItems,
      },
    });
  } else {
    await prisma.cart.update({
      where: { userId },
      data: { items: currentItems },
    });
  }

  return currentItems;
}

export const chatWithAssistant = async (req: Request, res: Response, next: NextFunction) => {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const auth = getAuth(req);
    if (!auth || !auth.userId) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Authentication required' })}\n\n`);
      res.end();
      return;
    }

    const dbUser = await getDbUser(auth.userId);
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Message text is required' })}\n\n`);
      res.end();
      return;
    }

    // 0. Check for Greeting/Small Talk
    if (/^(hi|hello|hey|greetings|what's up|how are you)/i.test(message.trim())) {
      const greetingText = `Hi there! 👋 Welcome to EcoMarket. What would you like to explore today? I can help you find:
• Sustainable products
• Eco-friendly masterclasses
• Products in a specific category`;

      const tokens = greetingText.split(' ');
      for (const token of tokens) {
        res.write(`data: ${JSON.stringify({ type: 'delta', text: token + ' ' })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return;
    }

    // 1. Intent Detection & Category Direct Query
    const intent = detectIntent(message);
    const category = mapQueryToCategory(message);

    let topResults: any[] = [];

    // If user asked for specific category, query directly from Product table
    if (category) {
      const displayCategory = categoryDisplayMap[category] || category;
      const directProducts = await prisma.product.findMany({
        where: {
          OR: [
            { category: { equals: category, mode: 'insensitive' } },
            { category: { equals: displayCategory, mode: 'insensitive' } },
          ],
          stock: { gt: 0 },
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          category: true,
          stock: true,
          images: true,
          seller: { select: { name: true } },
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      if (directProducts && directProducts.length > 0) {
        topResults = directProducts.map((p) => ({
          ...p,
          name: p.title,
          image: p.images?.[0] || '',
          type: 'PRODUCT',
          contentType: 'PRODUCT',
        }));
      }
    }

    // Fallback to semantic search if no category or direct category returned 0 items
    if (topResults.length === 0) {
      const semanticResults = await findSimilarItems(message, 6, intent);

      let filteredResults = semanticResults;
      if (intent === 'PRODUCT') {
        filteredResults = semanticResults.filter(
          (r) => r.type === 'product' || r.type === 'PRODUCT' || r.contentType === 'PRODUCT'
        );
      } else if (intent === 'COURSE') {
        filteredResults = semanticResults.filter(
          (r) => r.type === 'course' || r.type === 'COURSE' || r.contentType === 'COURSE'
        );
      }

      topResults = filteredResults.slice(0, 5); // Top 5 matching items
    }

    const isAddRequest = /add|buy|cart|order/i.test(message);

    const catalogContextText = topResults
      .map(
        (item) =>
          `- [${item.type}] ID: ${item.id} | Title: "${item.title || item.name}" | Price: ₹${Number(item.price)} | Category: ${item.category} | Description: ${item.description || ''}`
      )
      .join('\n');

    // 2. Check Google Gemini API Key
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const isValidGeminiKey =
      geminiKey &&
      geminiKey.trim().length > 10 &&
      !geminiKey.includes('your_') &&
      !geminiKey.includes('placeholder');

    if (isValidGeminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey.trim());
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: `${SYSTEM_PROMPT}

RETRIEVED CATALOG CONTEXT:
${catalogContextText}`,
        });

        const prompt = `User query: "${message}"\nRecommend relevant items from the catalog context and explain why they fit.`;
        const result = await model.generateContentStream(prompt);

        let geminiRawResponse = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            geminiRawResponse += chunkText;
          }
        }

        const formattedResponse = formatAIResponse(geminiRawResponse);
        const tokens = formattedResponse.split(' ');
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i] + (i < tokens.length - 1 ? ' ' : '');
          res.write(`data: ${JSON.stringify({ type: 'delta', text: token })}\n\n`);
          await new Promise((resolve) => setTimeout(resolve, 15));
        }

        // Handle Add to Cart action if user asked
        if (isAddRequest && topResults.length > 0) {
          const itemToAdd = topResults[0];
          await executeAddToCart(dbUser.id, [{ id: itemToAdd.id, type: itemToAdd.type, quantity: 1 }]);
          res.write(
            `data: ${JSON.stringify({
              type: 'cart_action',
              addedItems: [{ id: itemToAdd.id, title: itemToAdd.title || itemToAdd.name, price: Number(itemToAdd.price), type: itemToAdd.type }],
            })}\n\n`
          );
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
        return;
      } catch (geminiErr: any) {
        console.error('Gemini API call failed:', geminiErr?.message || geminiErr);
      }
    }

    // 3. Fallback Grounded Intelligence Engine (when external LLM APIs fail or key format is unrecognized)
    const topItems = topResults.slice(0, 5);

    let replyText = '';
    if (topItems.length > 0) {
      if (category) {
        replyText = `Based on our verified sustainable catalog, here are top recommended items matching your request:\n\n`;
        topItems.forEach((item) => {
          replyText += `• ${item.title || item.name} (${item.category}) — ₹${Number(item.price)}\n`;
        });
      } else if (intent === 'COURSE') {
        replyText = `Hello! Based on our verified educational catalog, here are top recommended courses matching your request:\n\n`;
        topItems.forEach((item) => {
          replyText += `• ${item.title} (Digital Masterclass) — ₹${Number(item.price)}\n  ${item.description}\n\n`;
        });
      } else {
        replyText = `Hello! Based on our verified sustainable catalog, here are top recommended items matching your request:\n\n`;
        topItems.forEach((item) => {
          replyText += `• ${item.title || item.name} (Eco Product) — ₹${Number(item.price)}\n  ${item.description || ''}\n\n`;
        });
      }
    } else {
      replyText = `I searched our catalog, but could not find exact matching ${intent === 'COURSE' ? 'courses' : intent === 'PRODUCT' ? 'products' : 'items'} at this time.`;
    }

    const formattedResponse = formatAIResponse(replyText);
    const tokens = formattedResponse.split(' ');
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i] + (i < tokens.length - 1 ? ' ' : '');
      res.write(`data: ${JSON.stringify({ type: 'delta', text: token })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Handle add to cart action if user requested
    if (isAddRequest && topItems.length > 0) {
      const itemToAdd = topItems[0];
      await executeAddToCart(dbUser.id, [{ id: itemToAdd.id, type: itemToAdd.type, quantity: 1 }]);
      res.write(
        `data: ${JSON.stringify({
          type: 'cart_action',
          addedItems: [{ id: itemToAdd.id, title: itemToAdd.title || itemToAdd.name, price: Number(itemToAdd.price), type: itemToAdd.type }],
        })}\n\n`
      );
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error: any) {
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: error.message || 'AI Assistant service is temporarily unavailable.',
      })}\n\n`
    );
    res.end();
  }
};

// Direct category & user query handler (Change 2)
export async function handleUserQuery(userQuery: string, userId?: string) {
  const intent = mapQueryToCategory(userQuery);

  let products: any[] = [];

  // If user asked for specific category, query directly
  if (intent) {
    const displayCategory = categoryDisplayMap[intent] || intent;
    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          { category: { equals: intent, mode: 'insensitive' } },
          { category: { equals: displayCategory, mode: 'insensitive' } },
        ],
        stock: { gt: 0 }, // Only in-stock items
      },
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        stock: true,
        images: true,
        seller: { select: { name: true } },
      },
      take: 5, // Top 5 products
      orderBy: { createdAt: 'desc' }, // Newest first
    });

    products = dbProducts.map((p) => ({
      ...p,
      name: p.title,
      image: p.images?.[0] || '',
      type: 'PRODUCT',
      contentType: 'PRODUCT',
    }));
  } else {
    // Generic query - use semantic search as fallback
    const items = await findSimilarItems(userQuery, 5, 'PRODUCT');
    products = items.map((p) => ({
      ...p,
      name: p.title,
      image: p.images?.[0] || '',
      type: 'PRODUCT',
      contentType: 'PRODUCT',
    }));
  }

  // Format response
  const formattedProducts = products
    .map((p) => `• ${p.name || p.title} (${p.category}) — ₹${p.price}`)
    .join('\n');

  return {
    message: `Based on our verified sustainable catalog, here are top recommended items matching your request:\n\n${formattedProducts}`,
    data: products,
  };
}

// Explicit category search endpoint (Change 4)
// GET /api/v1/ai/category-search?q=organic%20products
export async function searchByCategory(req: Request, res: Response) {
  const query = (req.query.q as string) || req.body?.query || '';
  const category = mapQueryToCategory(query);

  if (!category) {
    // Generic search fallback
    return res.json({ message: 'Please specify a product type (organic, artisan, eco, spices)' });
  }

  const displayCategory = categoryDisplayMap[category] || category;
  const dbProducts = await prisma.product.findMany({
    where: {
      OR: [
        { category: { equals: category, mode: 'insensitive' } },
        { category: { equals: displayCategory, mode: 'insensitive' } },
      ],
      stock: { gt: 0 },
    },
    select: {
      id: true,
      title: true,
      price: true,
      category: true,
      stock: true,
      images: true,
      seller: { select: { name: true } },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const products = dbProducts.map((p) => ({
    ...p,
    name: p.title,
    image: p.images?.[0] || '',
    type: 'PRODUCT',
    contentType: 'PRODUCT',
  }));

  const formatted = products.map((p) => `• ${p.name} — ₹${p.price}`).join('\n');

  return res.json({
    message: `Top ${products.length} ${category.replace('_', ' ').toLowerCase()} products:\n\n${formatted}`,
    data: products,
  });
}

export const searchCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.query.q as string) || req.body?.query || '';
    if (!query.trim()) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Query is required' } });
    }

    const intent = detectIntent(query);
    const semanticResults = await findSimilarItems(query, 10, intent);

    let filteredResults = semanticResults;
    if (intent === 'PRODUCT') {
      filteredResults = semanticResults.filter(
        (r) => r.type === 'product' || r.type === 'PRODUCT' || r.contentType === 'PRODUCT'
      );
    } else if (intent === 'COURSE') {
      filteredResults = semanticResults.filter(
        (r) => r.type === 'course' || r.type === 'COURSE' || r.contentType === 'COURSE'
      );
    }

    const topResults = filteredResults.slice(0, 5);

    return res.status(200).json({
      success: true,
      intent,
      data: topResults,
    });
  } catch (error) {
    next(error);
  }
};
