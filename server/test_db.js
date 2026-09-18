const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    const orders = await prisma.order.findMany({
      take: 1
    })
    console.log("Successfully queried orders! length:", orders.length)
  } catch(e) {
    console.log("Error querying orders:", e)
  }
}

main().finally(() => prisma.$disconnect())
