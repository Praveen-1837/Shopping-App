import re

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'r') as f:
    content = f.read()

# Replace the deliveryPartnerId filtering logic
old_logic = """    if (dbUser.role === Role.DELIVERY_PARTNER) {
      whereClause.deliveryPartnerId = dbUser.id;
    }"""

new_logic = """    // TODO: add per-partner assignment before production
    // For this demo, ANY approved Delivery Partner sees ALL orders platform-wide.
    // if (dbUser.role === Role.DELIVERY_PARTNER) {
    //   whereClause.deliveryPartnerId = dbUser.id;
    // }"""

content = content.replace(old_logic, new_logic)

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'w') as f:
    f.write(content)
