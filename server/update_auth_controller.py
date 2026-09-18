import re

with open('/home/praveenshinde/Shopping app/server/src/modules/auth/authController.ts', 'r') as f:
    content = f.read()

# Remove the faulty sync logic in getMe that overwrites the DB role with stale session role
old_sync_logic = """    } else {
      const updateData: any = {};
      if (sessionRole && user.role !== sessionRole) {
        updateData.role = sessionRole;
      }
      if (realEmail && user.email !== realEmail) {
        updateData.email = realEmail;
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { clerkId },
          data: updateData,
        });
      }
    }"""

new_sync_logic = """    } else {
      const updateData: any = {};
      if (realEmail && user.email !== realEmail) {
        updateData.email = realEmail;
      }
      // CRITICAL FIX: Do NOT overwrite DB role with sessionRole.
      // The DB is the source of truth for roles. Admin approval updates DB. 
      // If we blindly trust the stale JWT token, we rollback admin approvals.
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { clerkId },
          data: updateData,
        });
      }
    }"""

content = content.replace(old_sync_logic, new_sync_logic)

with open('/home/praveenshinde/Shopping app/server/src/modules/auth/authController.ts', 'w') as f:
    f.write(content)

