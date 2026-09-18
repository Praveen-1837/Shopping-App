import re

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'r') as f:
    content = f.read()

# Make sure PACKED is in the array
old_in = "in: [OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],"
new_in = "in: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.IN_TRANSIT, OrderStatus.OUT_FOR_DELIVERY],"
content = content.replace(old_in, new_in)

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'w') as f:
    f.write(content)
