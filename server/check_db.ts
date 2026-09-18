import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const order = await prisma.order.findFirst()
    console.log("Success! Found order or no orders.", order)
  } catch(e) {
    console.log("Error querying orders:", e)
  }
}

main().finally(() => prisma.$disconnect())
