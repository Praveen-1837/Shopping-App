import re

with open('/home/praveenshinde/Shopping app/server/src/modules/commerce/orderController.ts', 'r') as f:
    content = f.read()

old_update = """    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus as OrderStatus,
        ...(newStatus === OrderStatus.CANCELLED && typeof cancellationReason === 'string'
          ? { cancellationReason: cancellationReason.trim() || null }
          : {}),
      },"""

new_update = """    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: newStatus as OrderStatus,
        ...(newStatus === OrderStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
        ...(newStatus === OrderStatus.CANCELLED && typeof cancellationReason === 'string'
          ? { cancellationReason: cancellationReason.trim() || null }
          : {}),
      },"""

content = content.replace(old_update, new_update)

with open('/home/praveenshinde/Shopping app/server/src/modules/commerce/orderController.ts', 'w') as f:
    f.write(content)
