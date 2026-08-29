import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Deterministic text-to-vector embedding fallback (1536 dimensions)
 * Converts text tokens into normalized 1536-D vector for pgvector cosine search.
 */
function createDeterministicEmbedding(text: string): number[] {
  const vector = new Array(1536).fill(0);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const words = normalized.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let charIdx = 0; charIdx < word.length; charIdx++) {
      const code = word.charCodeAt(charIdx);
      const dimension = (code * 31 + charIdx * 17 + i * 13) % 1536;
      vector[dimension] += 1.0;
    }
  }

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    return vector.map((val) => val / magnitude);
  }
  return vector;
}

export async function getEmbedding(text: string): Promise<number[]> {
  // Use deterministic 1536-D vector generation for local testing / fallback
  return createDeterministicEmbedding(text);
}

async function main() {
  console.log('--- Generating Catalog Vector Embeddings ---');

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products to embed.`);

  for (const product of products) {
    const textToEmbed = `${product.title} ${product.description} ${product.category} ${product.sustainabilityTags.join(' ')}`;
    const vector = await getEmbedding(textToEmbed);
    const vectorString = `[${vector.join(',')}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "ProductEmbedding" ("id", "productId", "embedding")
       VALUES (gen_random_uuid(), $1, $2::vector)
       ON CONFLICT ("productId")
       DO UPDATE SET "embedding" = $2::vector`,
      product.id,
      vectorString
    );
  }
  console.log(`Successfully generated vector embeddings for ${products.length} products.`);

  const courses = await prisma.course.findMany();
  console.log(`Found ${courses.length} courses to embed.`);

  for (const course of courses) {
    const textToEmbed = `${course.title} ${course.description} ${course.category}`;
    const vector = await getEmbedding(textToEmbed);
    const vectorString = `[${vector.join(',')}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "CourseEmbedding" ("id", "courseId", "embedding")
       VALUES (gen_random_uuid(), $1, $2::vector)
       ON CONFLICT ("courseId")
       DO UPDATE SET "embedding" = $2::vector`,
      course.id,
      vectorString
    );
  }
  console.log(`Successfully generated vector embeddings for ${courses.length} courses.`);

  console.log('--- Catalog Embeddings Complete ---');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Error generating embeddings:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
