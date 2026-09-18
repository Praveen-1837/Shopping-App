import re

with open('/home/praveenshinde/Shopping app/client/src/pages/DeliveryCentre.tsx', 'r') as f:
    content = f.read()

# Update handleAction
old_handle = """  const handleAction = (order: Order) => {
    let nextStatus = '';
    if (order.status === 'SHIPPED') nextStatus = 'IN_TRANSIT';
    else if (order.status === 'IN_TRANSIT') nextStatus = 'OUT_FOR_DELIVERY';
    else if (order.status === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';"""

new_handle = """  const handleAction = (order: Order) => {
    let nextStatus = '';
    if (order.status === 'PACKED') nextStatus = 'SHIPPED';
    else if (order.status === 'SHIPPED') nextStatus = 'IN_TRANSIT';
    else if (order.status === 'IN_TRANSIT') nextStatus = 'OUT_FOR_DELIVERY';
    else if (order.status === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';"""

content = content.replace(old_handle, new_handle)

# Update getActionLabel
old_label = """  const getActionLabel = (status: string) => {
    if (status === 'SHIPPED') return 'Mark Picked Up';
    if (status === 'IN_TRANSIT') return 'Mark Out for Delivery';
    if (status === 'OUT_FOR_DELIVERY') return 'Mark Delivered';
    return null;
  };"""

new_label = """  const getActionLabel = (status: string) => {
    if (status === 'PACKED') return 'Pick up from Seller';
    if (status === 'SHIPPED') return 'Mark Picked Up';
    if (status === 'IN_TRANSIT') return 'Mark Out for Delivery';
    if (status === 'OUT_FOR_DELIVERY') return 'Mark Delivered';
    return null;
  };"""

content = content.replace(old_label, new_label)

# Use deliveredAt if available
old_date = "{new Date(order.updatedAt).toLocaleDateString"
new_date = "{(order as any).deliveredAt ? new Date((order as any).deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(order.updatedAt).toLocaleDateString"

content = content.replace(old_date, new_date)

with open('/home/praveenshinde/Shopping app/client/src/pages/DeliveryCentre.tsx', 'w') as f:
    f.write(content)
