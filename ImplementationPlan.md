# ImplementationPlan.md — Phased Build Plan

## Working Method
- Reference documents (PRD.md, TechSpec.md, AppFlow.md, Design.md, Schema.md, Rules.md) are given to the agent as **context**, not as a "build everything now" instruction.
- Only **one phase** is built and reviewed at a time.
- Each phase ends with a manual check before moving to the next (see Tracker.md).
- No phase should require restructuring a previous phase's files — later integrations (e.g. real payment gateway) plug into isolated seams left in earlier phases.

---

## Phase 1 — Foundation
**Goal:** Working PERN boilerplate, nothing feature-specific yet.
- Create Supabase project; grab pooled (`DATABASE_URL`) and direct (`DIRECT_URL`) connection strings; enable the `vector` extension in advance (used later in Phase 7)
- Express server with health-check endpoint (`GET /api/v1/health`)
- Prisma connected to Supabase Postgres; run first migration (empty/User model only)
- React + Vite frontend scaffold, Tailwind configured with Design.md placeholder tokens
- Folder structure per TechSpec.md
- `.env.example` with all required variables (including Clerk and Supabase keys, even though Clerk isn't wired up until Phase 2)
- Basic README with local setup steps

**Exit criteria:** Backend starts, connects to Supabase DB, health check returns 200. Frontend starts and renders a placeholder home page hitting the health check.

---

## Phase 2 — Auth & Roles (Clerk Integration)
**Goal:** Users can sign up, log in, and access role-gated routes — via Clerk, not custom auth.
- Set up Clerk application (dev instance); add publishable/secret keys to `.env`
- Frontend: `@clerk/clerk-react` — `<SignIn/>`, `<SignUp/>`, `<UserButton/>`, `useUser()`/`useAuth()` wired into signup/login pages and navbar
- Backend: `@clerk/express` — `clerkMiddleware()` + `requireAuth()` on protected routes
- `User` model (Schema.md, Clerk-synced version) + migration
- Webhook endpoint `POST /api/v1/webhooks/clerk` (verified via `svix`) to upsert `User` rows on `user.created`/`user.updated`/`user.deleted`
- Role assignment: onboarding flow (or admin action) sets `publicMetadata.role` in Clerk; webhook syncs it into `User.role`
- Role-guard middleware reading `req.auth.sessionClaims.publicMetadata.role`
- Seed script: one demo Clerk user per role (created via Clerk dashboard or Clerk's backend API, then synced)

**Exit criteria:** Can sign up/log in via Clerk UI as each role; webhook correctly creates/updates the matching `User` row; role-gated route returns 403 for wrong role, 200 for correct role.

---

## Phase 3 — Product Catalog
**Goal:** Sellers can list products; customers can browse/search.
- `Product`, `Producer` models + migrations
- CRUD endpoints for products (seller-owned, admin override)
- Search/filter endpoint (category, price range, keyword)
- Frontend: `/shop` listing page, `/product/:id` detail page, seller "Add/Edit Product" form
- Image upload wired to Cloudinary/S3

**Exit criteria:** Seller can create a product with images; it appears in `/shop` and is searchable/filterable.

---

## Phase 4 — Cart & Checkout (+ Payments Placeholder)
**Goal:** Customer can build a cart and complete a mock checkout.
- `Cart` model + endpoints (add/remove/update items)
- Frontend: cart page distinguishing physical vs digital items
- Checkout page: delivery address form (shown only if physical items present), order summary
- `/checkout/payment` page: mock UI (card/UPI/wallet tabs), clearly labeled "Test Mode"
- Backend: `processPayment()` service — mocked success/failure, isolated for future real-gateway swap
- `Order`, `OrderItem` models + migrations; order created on mock payment success

**Exit criteria:** Full flow works end-to-end: add to cart → checkout → mock payment → order created → order confirmation page shown.

---

## Phase 5 — Course Catalog & Learning Engine
**Goal:** Educators can list courses; learners can browse and (after purchase) consume them.
- `Course`, `CourseProgress` models + migrations
- CRUD endpoints for courses (educator-owned)
- Frontend: `/courses` listing, `/course/:id` detail, educator "Add/Edit Course" form
- "My Learning" page: course player, module navigation, progress tracking, resume-from-last-point
- Certificate issuance logic (flag on 100% completion)

**Exit criteria:** Educator publishes a course; after a (mock) purchase, it appears in "My Learning" and progress persists across sessions.

---

## Phase 6 — Orders & Fulfillment Lifecycle
**Goal:** Order and course lifecycles are trackable end-to-end.
- Order status transitions (Confirmed → Packed → Shipped → In Transit → Out for Delivery → Delivered)
- Course activation triggered automatically on payment success (webhook stub, since payments are mocked)
- Frontend: order status stepper on order detail page; course activation confirmation
- "My World" → Orders and Courses tabs wired to real data

**Exit criteria:** Status changes reflect correctly in the UI for both physical orders and digital course activation.

---

## Phase 7 — AI Shopping Assistant
**Goal:** Conversational assistant recommends and adds items to cart.
- pgvector extension enabled; `ProductEmbedding`/`CourseEmbedding` models + migration
- Embedding generation script for existing catalog (run after seeding)
- `POST /api/v1/ai/chat` — retrieval + Claude API call + function-calling tools (`search_catalog`, `add_to_cart`)
- SSE streaming for chat responses
- Frontend: floating ChatWidget component, available across all pages

**Exit criteria:** Asking "I want to start terrace gardening" returns a grounded, catalog-based bundle recommendation with a working "add all to cart" action.

---

## Phase 8 — Producer Profiles & Impact
**Goal:** Trust/differentiation features live.
- Producer profile page (`/producer/:id`) — story, location, practices, products
- Traceability timeline component wired to `Product.traceabilityStages`
- `ImpactMetrics` model + aggregation logic (recalculated on order/course completion)
- "My Impact" dashboard page

**Exit criteria:** A product linked to a producer shows their story and traceability; completing an order updates the buyer's My Impact numbers.

---

## Phase 9 — Seller / Farmer / Educator Dashboards
**Goal:** Full operational dashboards for all seller-type roles.
- Seller Centre: products, orders, pricing, promotions, analytics
- Farmer Centre: simplified mobile-friendly version, voice-assisted listing (text-to-structured-listing via AI, can reuse Phase 7's AI layer)
- Educator Centre: courses, student progress overview, payouts

**Exit criteria:** Each role can fully manage their own listings and see their own orders/analytics without seeing other sellers' data.

---

## Phase 10 — Polish Pass
**Goal:** Production-readiness sweep.
- Apply final Design.md tokens (from generated ui-ux-pro-max design system) across all pages
- Responsive QA at all four breakpoints
- Accessibility checklist pass (Design.md Section 8)
- Loading states, empty states, error states on every data-dependent page
- Basic test coverage for auth, cart, checkout, and AI chat endpoints
- Swagger/OpenAPI docs generated for the full API surface

**Exit criteria:** No broken states on any page under normal use; accessibility checklist fully checked; core flows covered by automated tests.

---

## Deferred (Post-MVP, Not Scheduled Yet)
- Real payment gateway integration (Razorpay/Stripe) — plug into isolated `processPayment()` seam from Phase 4
- Live commerce (streaming)
- Voice search / multi-region-language voice listing beyond basic text-to-listing
- Subscriptions billing automation
- Gamification challenges/leaderboards beyond basic eco-points
- Mobile native apps
