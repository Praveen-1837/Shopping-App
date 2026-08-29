# memory.md — Project Memory & Context Preservation

> **Notice for AI Models:** If model switching or context resetting occurs, read this file along with `Tracker.md` and `ImplementationPlan.md` to immediately resume full workspace context without losing state.

---

## 1. Project Overview
- **Name:** Multi-Vendor E-Commerce & Digital Learning Ecosystem (`Shopping app`)
- **Core Concept:** Combines physical sustainable marketplace (farmers, artisans, eco-brands) + digital learning courses + AI-powered conversational discovery + traceability + personal sustainability impact tracking.
- **Positioning:** SHOP + LEARN + DISCOVER + CONNECT + IMPACT.

---

## 2. Tech Stack Architecture (PERN + Supabase + Clerk)
| Layer | Tech | Details |
|---|---|---|
| Database | **Supabase (Managed PostgreSQL)** | Native `pgvector` support. Dual connection: `DATABASE_URL` (pooled, pgBouncer) for app queries, `DIRECT_URL` (direct) for Prisma migrations. |
| Auth | **Clerk** | Hosted auth (`@clerk/clerk-react` frontend, `@clerk/express` backend). Role stored in `publicMetadata.role`, synced to local `User` table via `POST /api/v1/webhooks/clerk` (Svix verified). |
| Backend | Express.js (Node.js) | REST API under `/api/v1/`, modular domain organization |
| ORM | Prisma | Schema management, type safety, migrations using `directUrl` |
| Frontend | React (Vite) | SPA, route-based splitting, Clerk UI components |
| Styling | Tailwind CSS | Modern, earthy palette tokens |
| Server State | TanStack Query | API caching & fetching (`@tanstack/react-query`) |
| Client State | Zustand | Cart & UI state (Auth session managed by Clerk) |
| AI Assistant | Anthropic Claude API + pgvector | Grounded product/course bundle recommendations on Supabase, SSE streaming |
| Payments | Mocked `processPayment()` | Isolated seam with "Test Mode" UI (`paymentService.ts`); Razorpay/Stripe swap post-MVP |

---

## 3. Project Documentation Index
- **`ecommerce_platform_build_prompt.md`**: Master prompt & specification reference for the entire platform build.
- **`PRD.md`**: Core vision, personas, 14 modules, MVP scope, key differentiators.
- **`TechSpec.md`**: Architectural specification updated for **Supabase Postgres** & **Clerk Auth**, webhook user sync, middleware, env vars.
- **`Schema.md`**: Updated Prisma schema (`User.clerkId`, no `passwordHash`, `directUrl` for Supabase) & models (`Producer`, `Product`, `Course`, `Cart`, `Order`, `OrderItem`, `CourseProgress`, `Review`, `Subscription`, `ImpactMetrics`, `ProductEmbedding`, `CourseEmbedding`).
- **`AppFlow.md`**: Customer journey, Auth flow, Chatbot flow, Seller/Farmer/Educator flow, Course consumption, My Impact flow, complete page sitemap.
- **`Design.md`**: Earthy & trustworthy design system, color palette, typography, UI components, accessibility checklist.
- **`ImplementationPlan.md`**: 10-Phase sequential build plan (Phase 1 Foundation → Phase 2 Clerk Auth → Phase 3 Product Catalog → Phase 4 Cart & Checkout → Phase 10 Polish Pass).
- **`Rules.md`**: Mandatory guardrails: scope discipline, Clerk auth rules (`publicMetadata.role` as source of truth, Svix signature verification), strict API response formats, no raw SQL, isolated payment seam, catalog-grounded AI recommendations.
- **`Tracker.md`**: Live phase status log, updated open decisions (Supabase + Clerk choices logged), known risks.

---

## 4. Phased Execution Status
- **Current Phase:** Phase 4 (Cart & Checkout + Payments Placeholder) — **Completed**
- **Next Phase:** **Phase 5 — Course Catalog & Learning Engine**
- **Rules of Engagement:** 
  1. Build and verify exactly ONE phase at a time per `ImplementationPlan.md`.
  2. Do not skip phases or scaffold future phase logic prematurely.
  3. Verify phase exit criteria before marking status as `Done` in `Tracker.md`.

---

## 5. Key Design Principles & Guardrails
- **Design Aesthetic:** Warm neutrals, natural green (`#2F5233`), earthy gold (`#D9A566`), charcoal text (`#1F2421`). Avoid generic AI purple/pink gradients or stark cold SaaS styling.
- **Auth & Security:** Delegated to Clerk (`@clerk/clerk-react` + `@clerk/express`). User roles stored in `publicMetadata.role` and read from `req.auth.sessionClaims`. Webhook endpoint (`/api/v1/webhooks/clerk`) verifies Svix signatures.
- **AI Chatbot:** Grounded strictly in catalog data via vector embeddings (`pgvector` on Supabase); no hallucinated products or prices. Uses function-calling tools (`add_to_cart`, `search_catalog`).
- **Payment Seam:** Mocked behind `processPayment()` service function with prominent `Test Mode` UI badges during MVP.
- **Roles & Permissions:** `CUSTOMER`, `SELLER`, `FARMER`, `ARTISAN`, `EDUCATOR`, `ADMIN`.

---

## 6. How to Resume Work (For AI Agents)
1. Read `memory.md` (this file) for overall project scope and guardrails.
2. Read `Tracker.md` to see the current active phase and completed steps.
3. Check `ImplementationPlan.md` for the exact exit criteria of the active phase.
4. Execute only the code required for the current phase, verify it, update `Tracker.md`, and present the outcome.
