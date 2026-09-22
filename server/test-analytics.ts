import { getAnalytics } from './src/modules/seller/sellerController';
import { prisma } from './src/config/db';

async function runTest() {
  console.log('Testing getAnalytics logic natively...');

  // Create a mock user in DB if none exists
  let testUser = await prisma.user.findFirst({ where: { role: 'FARMER' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        clerkId: 'test_farmer_mock_id',
        email: 'mock_farmer@test.com',
        name: 'Mock Farmer',
        role: 'FARMER'
      }
    });
  }

  // Mock Request and Response
  const req = {
    auth: { userId: testUser.clerkId } // @clerk/express getAuth uses req.auth
  } as any;

  const res = {
    status: function(s: number) {
      this.statusCode = s;
      return this;
    },
    json: function(data: any) {
      console.log('Response Status:', this.statusCode);
      console.log('Response Data:', JSON.stringify(data, null, 2));
    }
  } as any;

  const next = (err: any) => console.error('Next called with error:', err);

  await getAnalytics(req, res, next);
  
  // Cleanup
  await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
}

runTest().catch(console.error).finally(() => process.exit(0));
