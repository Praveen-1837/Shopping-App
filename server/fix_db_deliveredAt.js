const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);`)
    console.log("Successfully added deliveredAt.")
  } catch(e) {
    console.log("Error or already exists:", e)
  }
}
main().finally(() => prisma.$disconnect())
