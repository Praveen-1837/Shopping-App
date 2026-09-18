import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Adding deliveryPartnerId to Order table...")
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "deliveryPartnerId" TEXT;`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryPartnerId_fkey" FOREIGN KEY ("deliveryPartnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;`)
    console.log("Successfully added column and foreign key constraint.")
  } catch(e) {
    console.log("Error or already exists:", e)
  }
}

main().finally(() => prisma.$disconnect())
