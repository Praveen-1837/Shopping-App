import re

with open('/home/praveenshinde/Shopping app/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Check if deliveryPartnerId exists
if "deliveryPartnerId" not in content:
    # Add deliveryPartnerId and relation to Order
    order_pattern = re.compile(r'(model Order \{.*?)(cancellationRequested)', re.DOTALL)
    
    def replace_order(match):
        return match.group(1) + "deliveryPartnerId String?\n  deliveryPartner   User?         @relation(\"DeliveryOrders\", fields: [deliveryPartnerId], references: [id])\n  " + match.group(2)
        
    content = order_pattern.sub(replace_order, content)
    
    # Add reverse relation to User
    user_pattern = re.compile(r'(model User \{.*?)(roleApplications RoleApplication\[\])', re.DOTALL)
    def replace_user(match):
        return match.group(1) + match.group(2) + "\n  deliveries       Order[]           @relation(\"DeliveryOrders\")\n"
        
    content = user_pattern.sub(replace_user, content)
    
    with open('/home/praveenshinde/Shopping app/server/prisma/schema.prisma', 'w') as f:
        f.write(content)
