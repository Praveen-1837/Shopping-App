with open('/home/praveenshinde/Shopping app/client/src/components/PartnerLockGuard.tsx', 'r') as f:
    content = f.read()

# Refine allowed paths
content = content.replace("isAllowed = path.startsWith('/seller');", "isAllowed = path.startsWith('/seller');") # Wait, /seller-centre starts with /seller

with open('/home/praveenshinde/Shopping app/client/src/components/PartnerLockGuard.tsx', 'w') as f:
    f.write(content)
