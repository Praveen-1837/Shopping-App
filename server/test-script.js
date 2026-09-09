const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.roleApplication.count({ where: { requestedRole: 'BAD_ROLE' } });
  } catch (e) {
    console.log(e.message);
  }
}
main();
