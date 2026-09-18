import re

with open('/home/praveenshinde/Shopping app/server/src/modules/commerce/orderController.ts', 'r') as f:
    content = f.read()

old_allowed = "const deliveryAllowedStatuses: string[] = [OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];"
new_allowed = "const deliveryAllowedStatuses: string[] = [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];"

content = content.replace(old_allowed, new_allowed)

with open('/home/praveenshinde/Shopping app/server/src/modules/commerce/orderController.ts', 'w') as f:
    f.write(content)
