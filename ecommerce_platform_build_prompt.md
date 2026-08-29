# Build Prompt: World-Class E-Commerce + Learning Platform (PERN Stack)

Use this prompt in Antigravity / Claude Code / Cursor to scaffold the project. Paste it as-is, then iterate section by section (don't ask the agent to build all 28 modules in one shot — follow the phased workflow at the bottom).

---

## PROMPT

You are building a **multi-vendor e-commerce + digital learning marketplace** called "[YOUR PLATFORM NAME]" using the **PERN stack**:

- **P — PostgreSQL** (primary relational database)
- **E — Express.js** (REST API backend)
- **R — React** (frontend, with Vite)
- **N — Node.js** (runtime)

### Product Vision
A platform combining commerce, learning, AI-powered discovery, producer stories, traceability, community and sustainability impact — similar in scale/UX to Amazon/Flipkart, but focused on sustainable products, farmers/artisans, and courses. Tagline: **SHOP + LEARN + DISCOVER + CONNECT + IMPACT**.

### Core Modules to Build
1. **Auth & Users** — customer, seller, farmer, educator, and admin roles (JWT-based auth, role-based access control)
2. **Product Catalog (Commerce Engine)** — physical products, categories, multi-vendor listings, search, filters
3. **Course Catalog (Learning Engine)** — courses, modules, videos, quizzes, certificates
4. **Cart & Checkout** — unified cart for physical + digital items, single checkout flow, multiple payment methods
5. **Orders & Learning Progress** — order lifecycle (confirmed → packed → shipped → delivered) and course lifecycle (activated → in-progress → completed → certified)
6. **Seller/Farmer/Educator Dashboards** — onboarding, product/course management, analytics, payouts
7. **AI Shopping Assistant** — conversational chatbot for product/course discovery and cart building
8. **Producer Profiles & Traceability** — farmer/artisan story pages, farm-to-customer journey tracking
9. **User Dashboard ("My World")** — orders, courses, certificates, wishlist, impact metrics, rewards
10. **Reviews, Wishlist, Subscriptions, Gamification (Eco-Points)** — supporting features
11. **Payment Gateway Page** — dedicated checkout/payments screen (placeholder for now; low priority, but the route/UI shell should exist from Phase 1 so later phases can plug a real gateway in without restructuring)

### Tech Stack Requirements

**Backend**
- Node.js + Express.js — REST API, organized by module (routes/controllers/services per domain: commerce, learning, marketplace, ai, impact)
- PostgreSQL — use **Prisma ORM** (or Sequelize) for schema, migrations, and type-safe queries
- JWT + bcrypt for authentication; role-based middleware for customer/seller/farmer/admin
- Redis (optional, phase 2) — cart sessions and caching
- Multer + Cloudinary/AWS S3 — product image and video uploads
- Razorpay or Stripe SDK — payment integration with webhook handling for order/course activation
- **Payments page**: build a standalone `/checkout/payment` route now with a static/mock UI (card, UPI, wallet tabs) even before the real gateway is wired up. Keep the payment provider logic behind a single service function (e.g. `processPayment()`) so swapping in Razorpay/Stripe later only touches one file, not the UI
- Socket.io or SSE — real-time AI chatbot streaming responses

**Frontend**
- React (Vite) + React Router — SPA with route-based code splitting
- Tailwind CSS — styling (apply the ui-ux-pro-max design system for this platform: e-commerce/marketplace + sustainability visual identity — soft, trustworthy, earthy-premium palette, avoid generic "AI purple/pink gradients")
- React Query (TanStack Query) — API data fetching/caching
- Zustand or Redux Toolkit — global state (cart, auth, user session)
- Axios — API client

**AI Chatbot**
- Anthropic Claude API (or OpenAI) integrated via a dedicated `/api/ai/chat` Express route
- RAG-lite approach: embed product/course catalog into pgvector (Postgres extension) for semantic retrieval
- Function calling / tool use so the assistant can query live inventory and add items to cart, not just respond conversationally

**Database Schema (initial entities)**
```
users (id, name, email, password_hash, role, created_at)
products (id, seller_id, title, description, price, category, stock, images, sustainability_tags)
courses (id, educator_id, title, description, price, duration, modules_json)
producers (id, user_id, name, location, story, farming_practices)
orders (id, user_id, status, total, payment_id, created_at)
order_items (id, order_id, product_id, course_id, quantity, price)
course_progress (id, user_id, course_id, completed_modules, certificate_issued)
carts (id, user_id, items_json)
reviews (id, user_id, product_id/course_id, rating, comment)
subscriptions (id, user_id, plan, status, renewal_date)
impact_metrics (id, user_id, farmers_supported, co2_or_plastic_saved, amount_spent_with_producers)
```

### Workflow / Non-Functional Requirements
- RESTful API with clear versioning (`/api/v1/...`)
- Input validation (Zod or Joi) on every endpoint
- Centralized error handling middleware
- Environment-based config (`.env` for DB URL, JWT secret, payment keys, AI API key)
- Seed script for demo data (sample products, courses, producers)
- API documentation (Swagger/OpenAPI)
- Basic test coverage (Jest + Supertest for backend)
- Mobile-responsive UI (test at 375px, 768px, 1024px, 1440px breakpoints)
- Accessibility: 4.5:1 text contrast, visible focus states, keyboard navigation

### Deliverable for This Session
Start with **Phase 1 only** (see phased workflow below) — do not scaffold all modules at once.

---

## Recommended Phased Build Workflow

Don't ask the agent to build everything in one prompt — it'll produce shallow, half-working code across too many files. Work in phases, review each, then move on:

| Phase | Scope | Ask the agent to... |
|---|---|---|
| **1. Foundation** | Project scaffold | Set up PERN boilerplate: Express server, Prisma + Postgres connection, React+Vite frontend, folder structure, `.env.example` |
| **2. Auth** | Users & roles | Build signup/login, JWT middleware, role-based route protection (customer/seller/farmer/admin) |
| **3. Product Catalog** | Commerce core | Product CRUD, category/search endpoints, seller product management UI |
| **4. Cart & Checkout** | Commerce core | Cart state, checkout flow, and a **payments page UI** (mock/placeholder gateway — card/UPI/wallet tabs, no live transactions yet). Real gateway (Razorpay/Stripe) can be wired in during a later phase without changing this UI |
| **5. Course Catalog** | Learning core | Course CRUD, video/module structure, "My Learning" dashboard, progress tracking |
| **6. Orders & Fulfillment** | Post-purchase | Order status lifecycle, course activation on payment webhook |
| **7. AI Chatbot** | Differentiator | Chat widget UI + `/api/ai/chat` route + product/course retrieval for recommendations |
| **8. Producer Profiles & Impact** | Differentiator | Producer pages, traceability view, "My Impact" dashboard |
| **9. Seller/Farmer/Educator Dashboards** | Operations | Onboarding, listing management, analytics |
| **10. Polish** | UX pass | Apply design system consistently, responsive fixes, loading/error states, accessibility pass |

Suggested prompt for kicking off Phase 1 in Antigravity:

> "Using the attached build prompt, scaffold Phase 1 only: a PERN stack boilerplate with Express + Prisma + PostgreSQL backend and a React + Vite + Tailwind frontend. Set up the folder structure, database connection, and a health-check endpoint. Don't build any feature modules yet."

Then move to Phase 2, and so on — each phase builds on a working, reviewed base instead of one giant untested dump of code.
