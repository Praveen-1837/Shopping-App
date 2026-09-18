import re

with open('/home/praveenshinde/Shopping app/server/prisma/schema.prisma', 'r') as f:
    content = f.read()

if "deliveredAt" not in content:
    pattern = re.compile(r'(model Order \{.*?)(cancellationRequested)', re.DOTALL)
    def replacer(match):
        return match.group(1) + "deliveredAt     DateTime?\n  " + match.group(2)
    content = pattern.sub(replacer, content)
    with open('/home/praveenshinde/Shopping app/server/prisma/schema.prisma', 'w') as f:
        f.write(content)
