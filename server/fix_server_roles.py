import os
import re

def insert_role_guard(filepath, endpoints):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "import { roleGuard }" not in content:
        content = "import { roleGuard } from '../../middleware/roleGuard';\n" + content
    if "import { Role }" not in content:
        content = "import { Role } from '@prisma/client';\n" + content

    for endpoint in endpoints:
        # We look for something like: router.get('/cart', requireAuth(), getCart);
        # and change it to: router.get('/cart', requireAuth(), roleGuard([Role.CUSTOMER]), getCart);
        pattern = r"(router\.(get|post|put|patch|delete)\('([^']+)',\s*(requireAuth\(\)|requireAuth),)\s*([a-zA-Z0-9_]+)\);"
        
        def replacer(match):
            method, route, require_auth, handler = match.group(2), match.group(3), match.group(4), match.group(5)
            # Only apply to the endpoints in our list
            if route in endpoints or any(re.match(ep.replace(':id', '[^/]+').replace('*', '.*'), route) for ep in endpoints):
                return f"{match.group(1)} roleGuard([Role.CUSTOMER]), {handler});"
            return match.group(0)
            
        content = re.sub(pattern, replacer, content)
        
    with open(filepath, 'w') as f:
        f.write(content)

base = '/home/praveenshinde/Shopping app/server/src/modules'

insert_role_guard(f"{base}/cart/cartRoutes.ts", ['/cart', '/cart/items', '/cart/items/:productId', '/cart/clear'])
insert_role_guard(f"{base}/checkout/checkoutRoutes.ts", ['/checkout', '/orders', '/orders/:id'])
insert_role_guard(f"{base}/commerce/wishlistRoutes.ts", ['/wishlist', '/wishlist/:id'])
insert_role_guard(f"{base}/learning/courseRoutes.ts", ['/my-learning'])
insert_role_guard(f"{base}/commerce/orderRoutes.ts", ['/my-world/orders', '/orders/:id'])
insert_role_guard(f"{base}/commerce/productRoutes.ts", ['/products/:id/reviews'])
insert_role_guard(f"{base}/educator/educatorRoutes.ts", ['/courses/:id/reviews'])
insert_role_guard(f"{base}/user/userRoutes.ts", ['/users/profile', '/addresses', '/addresses/:id', '/addresses/:id/default', '/support/tickets'])

