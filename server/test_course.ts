import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const course = await prisma.course.findFirst();
  console.log(JSON.stringify(course, null, 2));
}
main();
