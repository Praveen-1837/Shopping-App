# AppFlow.md — Application & User Flows

## 1. Primary Customer Journey (end-to-end)
```
Open Website
   │
   ▼
AI-Personalized Home
   │
   ▼
Search / Voice / Image / Browse
   │
   ▼
Discover Product or Course
   │
   ▼
AI Explains / Recommends (optional, via chat widget)
   │
   ▼
View Product / Course Detail Page
   │
   ▼
Meet Producer / Watch Story (optional, for eligible products)
   │
   ▼
Add to Cart
   │
   ▼
Smart Cart (physical + digital items together)
   │
   ▼
One Checkout
   │
   ▼
Payment Page (placeholder/mock in MVP)
   │
   ├── Physical product → Order Confirmed → Packed → Shipped →
   │   In Transit → Out for Delivery → Delivered
   │
   └── Digital course → Payment Successful → Course Activated →
       Watch → Complete → Certificate
   │
   ▼
Review → Rewards (Eco-Points) → My Impact Dashboard Updated
```

## 2. Authentication Flow
```
Visitor lands on site
   │
   ▼
Sign Up / Log In
   │
   ├── Customer → default role, redirected to Home
   ├── Seller/Farmer/Educator → additional onboarding form → pending admin approval
   │       │
   │       └── Approved → redirected to their Centre (Seller/Farmer/Educator dashboard)
   └── Admin → redirected to Admin Panel
```

## 3. AI Shopping Assistant Flow
```
User opens chat widget (available on all pages)
   │
   ▼
User types: "I want to start terrace gardening. What do I need?"
   │
   ▼
Backend: embed query → pgvector search over products/courses
   │
   ▼
Claude API composes a bundle recommendation
   (seeds, manure, grow bags, tools, terrace gardening course, videos)
   │
   ▼
Assistant presents bundle in chat with "Add all to cart" action
   │
   ▼
User confirms → items added to Smart Cart
   │
   ▼
User proceeds to checkout (see Primary Customer Journey)
```

## 4. Cart & Checkout Flow (detail)
```
Add to Cart (from product/course page or AI assistant)
   │
   ▼
Cart Page
   - Shows physical items (needs delivery address) and
     digital items (instant access) separately labeled
   │
   ▼
Proceed to Checkout
   │
   ▼
Checkout Page
   - Delivery address (only if physical items present)
   - Order summary
   - Coupons/gift cards
   │
   ▼
Payment Page
   - Card / UPI / Net Banking / Wallet tabs (mock in MVP)
   │
   ▼
Payment Result
   ├── Success → Order created → redirect to Order Confirmation
   └── Failure → return to Payment Page with retry option
```

## 5. Seller / Farmer / Educator Flow
```
Login to Centre
   │
   ▼
Dashboard (orders, revenue snapshot, notifications)
   │
   ├── Add/Edit Product or Course
   │     │
   │     ▼
   │   (Farmer only) Voice-assisted listing option
   │     │
   │     ▼
   │   AI converts description into structured listing → Preview → Publish
   │
   ├── Manage Inventory / Pricing / Promotions
   ├── View & Fulfill Orders
   ├── View Payouts & Sales Analytics
   └── Respond to Customer Reviews
```

## 6. Course Consumption Flow
```
Course Purchased → Course Activated in "My Learning"
   │
   ▼
Course Player
   - Resume from last watched point
   - Move between modules
   - Access downloadable materials
   │
   ▼
Take Quiz/Assessment (if applicable)
   │
   ▼
Mark Module Complete → Progress updates
   │
   ▼
All Modules Complete → Certificate Issued
   │
   ▼
Certificate visible in "My World" → "My Certificates"
```

## 7. My Impact Dashboard Flow
```
User completes purchases/courses over time
   │
   ▼
Backend aggregates: farmers supported, plastic avoided,
₹ spent directly with producers, courses completed
   │
   ▼
"My Impact" page renders yearly scorecard
   (each metric links to a short explanation of how it's calculated)
```

## 8. Page-Level Sitemap (MVP)
```
/                          Home (personalized)
/shop                      Product listing/search
/product/:id               Product detail
/courses                   Course listing/search
/course/:id                Course detail
/cart                      Smart cart
/checkout                  Checkout (address + summary)
/checkout/payment           Payment page (mock in MVP)
/order/:id/confirmation      Order confirmation
/my-world                  User dashboard (orders, courses, wishlist, impact...)
/my-world/orders
/my-world/courses
/my-world/certificates
/my-world/impact
/producer/:id               Producer profile & traceability
/seller-centre               Seller dashboard
/farmer-centre                Farmer dashboard (simplified, voice listing)
/educator-centre              Educator dashboard
/login /signup                Auth
/admin                       Admin panel (approvals, moderation)
```
