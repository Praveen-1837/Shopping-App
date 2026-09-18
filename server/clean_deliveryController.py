with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'r') as f:
    content = f.read()

unreachable = """    return res.status(200).json({
      success: true,
      data: orders,
    });"""

content = content.replace(unreachable, "")

with open('/home/praveenshinde/Shopping app/server/src/modules/delivery/deliveryController.ts', 'w') as f:
    f.write(content)
