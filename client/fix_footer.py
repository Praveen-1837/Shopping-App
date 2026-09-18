import re

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'r') as f:
    content = f.read()

# Replace `{!isAdmin && (` with `{!hasAnyPartnerRole && (` in the footer
content = content.replace('{!isAdmin && (', '{!hasAnyPartnerRole && (')

with open('/home/praveenshinde/Shopping app/client/src/components/Footer.tsx', 'w') as f:
    f.write(content)
