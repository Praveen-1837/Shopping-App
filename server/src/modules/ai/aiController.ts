import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { prisma } from '../../config/db';
import { Role } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
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

export async function findSimilarItems(queryText: string, limit = 6) {
  const queryVector = await getEmbedding(queryText);
  const vectorStr = `[${queryVector.join(',')}]`;

  // Query vector similarity for products
  const productMatches: any[] = await prisma.$queryRawUnsafe(
    `SELECT p.id, p.title, p.description, p.price, p.category, p.stock, 'PRODUCT' as type,
            (pe.embedding <=> $1::vector) as distance
     FROM "Product" p
     JOIN "ProductEmbedding" pe ON p.id = pe."productId"
     ORDER BY distance ASC
     LIMIT $2`,
    vectorStr,
    limit
  );

  // Query vector similarity for courses
  const courseMatches: any[] = await prisma.$queryRawUnsafe(
    `SELECT c.id, c.title, c.description, c.price, c.category, c."durationMins", 'COURSE' as type,
            (ce.embedding <=> $1::vector) as distance
     FROM "Course" c
     JOIN "CourseEmbedding" ce ON c.id = ce."courseId"
     ORDER BY distance ASC
     LIMIT $2`,
    vectorStr,
    limit
  );

  let items = [...productMatches, ...courseMatches];

  if (items.length === 0) {
    const [allProducts, allCourses] = await Promise.all([
      prisma.product.findMany({ take: 5 }),
      prisma.course.findMany({ take: 5 }),
    ]);
    items = [
      ...allProducts.map((p) => ({ ...p, type: 'PRODUCT' })),
      ...allCourses.map((c) => ({ ...c, type: 'COURSE' })),
    ];
  }

  // Deduplicate items by unique ID
  const seenIds = new Set<string>();
  const uniqueItems = items.filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  return uniqueItems.slice(0, limit);
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

    // Retrieve Top Grounded Catalog Context
    const retrievedItems = await findSimilarItems(message, 6);
    const isAddRequest = /add|buy|cart|order/i.test(message);

    const catalogContextText = retrievedItems
      .map(
        (item) =>
          `- [${item.type}] ID: ${item.id} | Title: "${item.title}" | Price: ₹${Number(item.price)} | Category: ${item.category} | Description: ${item.description}`
      )
      .join('\n');

    // 1. Check Google Gemini API Key
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
          model: 'gemini-3.6-flash',
          systemInstruction: `You are the EcoMarket AI Shopping Assistant.
Your job is to recommend eco-friendly products and masterclasses strictly grounded in the database catalog context provided below.

STRICT GROUNDING RULES:
1. You MUST NEVER invent, fabricate, or recommend products/courses that are not in the catalog context.
2. If no items in context match the user query, state honestly that no relevant catalog items were found.
3. Be friendly, conversational, helpful, and concise.

RETRIEVED CATALOG CONTEXT:
${catalogContextText}`,
        });

        const prompt = `User query: "${message}"\nRecommend relevant items from the catalog context and explain why they fit.`;
        const result = await model.generateContentStream(prompt);

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            res.write(`data: ${JSON.stringify({ type: 'delta', text: chunkText })}\n\n`);
          }
        }

        // Handle Add to Cart action if user asked
        if (isAddRequest && retrievedItems.length > 0) {
          const itemToAdd = retrievedItems[0];
          await executeAddToCart(dbUser.id, [{ id: itemToAdd.id, type: itemToAdd.type, quantity: 1 }]);
          res.write(
            `data: ${JSON.stringify({
              type: 'cart_action',
              addedItems: [{ id: itemToAdd.id, title: itemToAdd.title, price: Number(itemToAdd.price), type: itemToAdd.type }],
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

    // 2. Check Anthropic Claude API Key
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const isValidAnthropicKey =
      anthropicKey &&
      anthropicKey.trim().startsWith('sk-ant-') &&
      !anthropicKey.includes('your_') &&
      !anthropicKey.includes('placeholder');

    if (isValidAnthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey.trim() });
        const systemPrompt = `You are the EcoMarket AI Shopping Assistant.
Your job is to recommend eco-friendly products and masterclasses strictly grounded in the database context provided below.

STRICT GROUNDING RULES:
1. You MUST NEVER invent, fabricate, or recommend products/courses that are not in the context.
2. If no items in context match the user query, state honestly that no relevant catalog items were found.

RETRIEVED CATALOG CONTEXT:
${catalogContextText}`;

        const messages: any[] = [
          ...conversationHistory.map((h: any) => ({
            role: h.role,
            content: h.content,
          })),
          { role: 'user', content: message },
        ];

        const stream = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: systemPrompt,
          messages,
          stream: true,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            res.write(`data: ${JSON.stringify({ type: 'delta', text: chunk.delta.text })}\n\n`);
          }
        }

        if (isAddRequest && retrievedItems.length > 0) {
          const itemToAdd = retrievedItems[0];
          await executeAddToCart(dbUser.id, [{ id: itemToAdd.id, type: itemToAdd.type, quantity: 1 }]);
          res.write(
            `data: ${JSON.stringify({
              type: 'cart_action',
              addedItems: [{ id: itemToAdd.id, title: itemToAdd.title, price: Number(itemToAdd.price), type: itemToAdd.type }],
            })}\n\n`
          );
        }

        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
        return;
      } catch (anthropicError: any) {
        console.warn('Anthropic API key returned error, falling back to Grounded Engine:', anthropicError?.message);
      }
    }

    // 3. Fallback Grounded Intelligence Engine (when external LLM APIs fail or key format is unrecognized)
    const topItems = retrievedItems.slice(0, 3);

    let replyText = `Hello! Based on our verified sustainable catalog, here are top recommended items matching your request:\n\n`;

    if (topItems.length > 0) {
      topItems.forEach((item) => {
        replyText += `• **${item.title}** (${item.type === 'COURSE' ? 'Digital Masterclass' : 'Eco Product'}) — **₹${Number(item.price)}**\n  _${item.description}_\n\n`;
      });
    } else {
      replyText = `I searched our catalog, but could not find exact matching products or masterclasses at this time.`;
    }

    // Stream text out
    const tokens = replyText.split(' ');
    for (const token of tokens) {
      res.write(`data: ${JSON.stringify({ type: 'delta', text: token + ' ' })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    // Handle add to cart action if user requested
    if (isAddRequest && topItems.length > 0) {
      const itemToAdd = topItems[0];
      await executeAddToCart(dbUser.id, [{ id: itemToAdd.id, type: itemToAdd.type, quantity: 1 }]);
      res.write(
        `data: ${JSON.stringify({
          type: 'cart_action',
          addedItems: [{ id: itemToAdd.id, title: itemToAdd.title, price: Number(itemToAdd.price), type: itemToAdd.type }],
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
