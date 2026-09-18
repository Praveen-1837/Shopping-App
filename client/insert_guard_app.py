import re

with open('/home/praveenshinde/Shopping app/client/src/App.tsx', 'r') as f:
    content = f.read()

# Add import
if 'PartnerLockGuard' not in content:
    content = content.replace(
        "import ProtectedRoute from './components/ProtectedRoute';",
        "import ProtectedRoute from './components/ProtectedRoute';\nimport PartnerLockGuard from './components/PartnerLockGuard';"
    )

# Wrap <Routes> with <PartnerLockGuard>
# Wait, <ErrorBoundary> <Suspense fallback={<PageLoader />}> <Routes> ...
routes_start = content.find('<Routes>')
routes_end = content.find('</Routes>') + len('</Routes>')

if '<PartnerLockGuard>' not in content:
    content = content[:routes_start] + '<PartnerLockGuard>\n            ' + content[routes_start:routes_end] + '\n            </PartnerLockGuard>' + content[routes_end:]

with open('/home/praveenshinde/Shopping app/client/src/App.tsx', 'w') as f:
    f.write(content)

