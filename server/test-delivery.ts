import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const delivery = await prisma.user.findFirst({ where: { role: 'DELIVERY_PARTNER' } });
  
  if (!delivery) {
    console.log("Creating mock delivery partner...");
    await prisma.user.create({
      data: {
        clerkId: 'test_delivery',
        email: 'delivery@example.com',
        name: 'Test Delivery',
        role: 'DELIVERY_PARTNER'
      }
    });
  }

  const testDelivery = await prisma.user.findFirst({ where: { role: 'DELIVERY_PARTNER' } });

  // Get a shipped order
  let order = await prisma.order.findFirst({ where: { status: 'SHIPPED' } });
  
  if (!order) {
    console.log("No SHIPPED order found, finding any order to set to SHIPPED...");
    order = await prisma.order.findFirst();
    if (order) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' }
      });
    } else {
      console.log("No order found to test.");
      process.exit(0);
    }
  }

  console.log(`Testing Order ${order.id} with status ${order.status}`);

  // Test the controller directly by mocking req, res, next
  const { updateOrderStatus } = require('./server/src/modules/commerce/orderController');
  
  const mockReq = {
    params: { id: order.id },
    body: { status: 'IN_TRANSIT' },
    dbUser: testDelivery
  };
  
  const mockRes = {
    status: (code: number) => {
      console.log("Status:", code);
      return {
        json: (data: any) => {
          console.log("Response:", JSON.stringify(data, null, 2));
        }
      }
    }
  };

  const mockNext = (err: any) => console.error("Next called with:", err);

  console.log("Calling updateOrderStatus with IN_TRANSIT...");
  await updateOrderStatus(mockReq, mockRes, mockNext);

  mockReq.body.status = 'OUT_FOR_DELIVERY';
  console.log("Calling updateOrderStatus with OUT_FOR_DELIVERY...");
  await updateOrderStatus(mockReq, mockRes, mockNext);

  mockReq.body.status = 'DELIVERED';
  console.log("Calling updateOrderStatus with DELIVERED...");
  await updateOrderStatus(mockReq, mockRes, mockNext);
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
