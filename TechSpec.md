# TechSpec.md — Technical Specification

## 1. Stack Overview (PERN)
| Layer | Technology | Notes |
|---|---|---|
| Database | **Supabase (managed PostgreSQL)** | Still plain Postgres under the hood; pgvector supported natively for AI embeddings |
| Backend | Express.js (Node.js) | REST API, modular by domain |
| ORM | Prisma | Schema, migrations, type-safe queries — connects to Supabase's Postgres via connection string |
| Frontend | React (Vite) | SPA, route-based code splitting |
| Styling | Tailwind CSS | Design tokens from Design.md |
| State (server) | TanStack Query | API caching/fetching |
| State (client) | Zustand | Cart, UI state (auth/session state comes from Clerk, not duplicated here) |
| Auth | **Clerk** | Hosted auth (signup/login/session), role stored in `publicMetadata`, synced to our own `User` table via webhook |
| File storage | Cloudinary or AWS S3 | Product/course images & video |
| AI | Anthropic Claude API + pgvector (on Supabase) | Chat assistant, semantic search |
| Payments | Placeholder now → Razorpay/Stripe later | Isolated behind one service function |
| Realtime (chat) | SSE or Socket.io | Streaming chatbot responses |

> **Note:** Supabase also offers its own Auth, Storage, and Realtime products. This project only uses **Supabase's Postgres database** (and pgvector). Auth is handled entirely by Clerk; file storage uses Cloudinary/S3 as listed above — avoid mixing in Supabase Auth/Storage to prevent two overlapping systems.

## 2. Architecture — Layered View
```
┌────────────────────────────────────────────┐
│  Customer Experience (React SPA)            │
│  Personalized home, search, shop, learn      │
└────────────────────────────────────────────┘
                   │ REST/JSON (Axios + TanStack Query)
┌────────────────────────────────────────────┐
│  Express API (versioned /api/v1)             │
│  ┌───────────┬───────────┬───────────┐      │
│  │ Commerce  │ Learning  │ Marketplace│      │
│  ├───────────┼───────────┼───────────┤      │
│  │ AI Layer  │ Content   │ Impact     │      │
│  ├───────────┴───────────┴───────────┤      │
│  │ Auth / Middleware / Validation     │      │
│  └────────────────────────────────────┘      │
└────────────────────────────────────────────┘
                   │ Prisma ORM
┌────────────────────────────────────────────┐
│  PostgreSQL (+ pgvector)                     │
└────────────────────────────────────────────┘
```

## 3. Backend Module Structure
```
server/
├── src/
│   ├── modules/
│   │   ├── auth/            (routes, controller, service, middleware)
│   │   ├── commerce/        (products, cart, checkout, orders)
│   │   ├── learning/        (courses, modules, progress, certificates)
│   │   ├── marketplace/     (seller/farmer/educator onboarding & dashboards)
│   │   ├── ai/              (chat route, embeddings, retrieval)
│   │   ├── payments/        (payment service — placeholder now)
│   │   ├── impact/          (impact metrics, eco-points)
│   │   └── content/         (producer profiles, traceability)
│   ├── middleware/          (auth guard, role guard, error handler, validation)
│   ├── config/              (env, db connection, third-party clients)
│   ├── prisma/               (schema.prisma, migrations, seed.ts)
│   └── app.ts / server.ts
```

## 4. API Design Principles
- Versioned base path: `/api/v1/...`
- Resource-based REST endpoints (`/products`, `/courses`, `/orders`, `/cart`, `/ai/chat`, `/payments`)
- Every request body validated with Zod before hitting a controller
- Centralized error-handling middleware returning a consistent shape:
  ```json
  { "success": false, "error": { "code": "STRING", "message": "..." } }
  ```
- Auth via Clerk session token, verified server-side using Clerk's Express middleware (`@clerk/express` — `clerkMiddleware()` + `requireAuth()`); role checked via a custom role-guard middleware that reads `req.auth.sessionClaims.publicMetadata.role`
- Pagination on all list endpoints (`?page=&limit=`)

## 4a. Auth Architecture (Clerk)
```
Frontend (React)
   │  @clerk/clerk-react — <SignIn/>, <SignUp/>, useUser(), useAuth()
   ▼
Clerk (hosted) — handles signup/login/session/password reset/social login
   │  issues session token
   ▼
Backend (Express)
   │  @clerk/express — clerkMiddleware() attaches req.auth
   │  requireAuth() protects routes
   │  roleGuard(role) middleware reads req.auth.sessionClaims.publicMetadata.role
   ▼
Our Postgres `User` table
   │  Source of truth for app-level relations (products, orders, etc.)
   │  Kept in sync with Clerk via webhook (see below)
```

**User sync webhook:** Clerk sends `user.created` / `user.updated` / `user.deleted` webhook events to `POST /api/v1/webhooks/clerk`. This handler upserts/removes the corresponding row in our `User` table (see Schema.md), keyed by `clerkId`. **Role is set in Clerk's `publicMetadata` by an admin action (or onboarding flow), never trusted directly from the frontend** — the backend always re-reads it from the verified session claims, not from a request body field.

## 5. Frontend Structure
```
client/
├── src/
│   ├── pages/          (Home, Shop, ProductDetail, CourseDetail, Cart,
│   │                     Checkout, Payment, MyWorld, SellerCentre, ...)
│   ├── components/     (shared UI: Navbar, ProductCard, CourseCard, ChatWidget)
│   ├── features/       (domain logic grouped: cart/, auth/, ai-chat/)
│   ├── hooks/
│   ├── store/          (Zustand slices)
│   ├── api/            (Axios instance + endpoint functions)
│   └── styles/         (Tailwind config, design tokens)
```

## 6. AI Chatbot Design
- Endpoint: `POST /api/v1/ai/chat`
- Flow: user message → embed query → pgvector similarity search over `products`/`courses` embeddings → construct context → call Claude API with retrieved items + function-calling tools (`add_to_cart`, `search_catalog`) → stream response back via SSE.
- Chatbot must ground recommendations in actual catalog data, not hallucinate products.

## 7. Payments (Placeholder Phase)
- Route: `/checkout/payment` (frontend) and `POST /api/v1/payments/process` (backend)
- Backend: single `processPayment(order)` service function — currently returns a mocked "success" response after a simulated delay.
- Frontend: static UI showing card / UPI / wallet tabs, disabled real submission, clear "Test Mode" label.
- Swap-in plan: when ready, replace only the internals of `processPayment()` with Razorpay/Stripe SDK calls and add webhook route `/api/v1/payments/webhook` — no other file should need to change.

## 8. Non-Functional Requirements
- **Security:** authentication/session handling delegated to Clerk (passwords, MFA, session expiry are Clerk's responsibility); Clerk webhook signature verification required (`svix` library) on the sync endpoint; input validation on every endpoint; parameterized queries via Prisma (no raw SQL string concat); rate limiting on AI endpoints.
- **Performance:** paginate all lists, index frequently queried columns (see Schema.md), cache catalog reads where reasonable.
- **Accessibility:** 4.5:1 contrast minimum, visible focus states, keyboard navigable, `prefers-reduced-motion` respected.
- **Responsiveness:** tested at 375px / 768px / 1024px / 1440px.
- **Testing:** Jest + Supertest for backend routes; component tests for critical frontend flows (cart, checkout).
- **Observability:** structured request logging; error tracking hook point (e.g., Sentry) reserved for later phase.

## 9. Environment Variables (initial)
```
# Database (Supabase Postgres)
DATABASE_URL=                  # pooled connection string (pgbouncer=true) — for app queries
DIRECT_URL=                    # direct connection string — for Prisma migrations

# Auth (Clerk)
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=  # verifies /api/v1/webhooks/clerk payloads

# File storage
CLOUDINARY_URL=                 # or AWS_S3_* vars

# AI
ANTHROPIC_API_KEY=

# Payments
PAYMENT_MODE=mock              # mock | razorpay | stripe (future)

CLIENT_URL=
PORT=
```

## 10. Deployment Notes (future phase)
- Backend: containerize with Docker; deploy to a managed Node host or ECS/Cloud Run.
- Database: Supabase-hosted Postgres (already managed) with pgvector enabled via Supabase's extension toggle.
- Frontend: static build via Vite, deployed to Vercel/Netlify or served via CDN.
- Auth: no separate deployment needed — Clerk is fully hosted; just configure production instance keys.
- CI: GitHub Actions — lint, test, build on PR.

## 11. Prisma + Supabase Connection Notes
- Use Supabase's **connection pooler** (port 6543, `?pgbouncer=true`) for `DATABASE_URL` used by the running app.
- Use Supabase's **direct connection** (port 5432) for `DIRECT_URL`, referenced in `schema.prisma` via Prisma's `directUrl` datasource field — required for running migrations reliably through the pooler.
- Enable the `vector` extension in the Supabase dashboard (Database → Extensions) before running the Phase 7 embeddings migration.
