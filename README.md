# Shopping App — Multi-Vendor E-Commerce & Digital Learning Ecosystem

A world-class platform combining commerce, learning, AI-powered discovery, producer stories, traceability, community, and measurable sustainability impact.

**Tagline:** SHOP + LEARN + DISCOVER + CONNECT + IMPACT.

---

## 🛠️ Stack Overview
- **Database:** PostgreSQL (Hosted on Supabase with `pgvector` enabled)
- **Backend:** Express.js (Node.js REST API with Prisma ORM)
- **Frontend:** React (Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand)
- **Auth:** Clerk (`@clerk/clerk-react` + `@clerk/express`)
- **AI Engine:** Anthropic Claude API + Supabase `pgvector`

---

## 🚀 Quick Start (Phase 1 — Foundation)

### 1. Prerequisites
- Node.js `v18+` or `v22+` installed
- Supabase account (PostgreSQL project created)

### 2. Environment Setup

#### Server Configuration
Navigate to `server/` and create `.env` from `.env.example`:
```bash
cd server
cp .env.example .env
```
Fill in your Supabase connection strings in `server/.env`:
- `DATABASE_URL`: Pooled connection string (port `6543`, `pgbouncer=true`)
- `DIRECT_URL`: Direct connection string (port `5432`)

#### Client Configuration
Navigate to `client/` and create `.env` from `.env.example`:
```bash
cd ../client
cp .env.example .env
```

---

### 3. Installation & Database Setup

#### Install All Dependencies
From the project root directory:
```bash
npm install && npm run install:all
```

#### Run Database Migrations
Inside `server/`:
```bash
cd server
npx prisma migrate dev --name init
```

---

### 4. Running Development Servers

Run both backend and frontend servers simultaneously from the project root with color-coded log output:
```bash
npm run dev
```
* **Backend (SERVER):** `http://localhost:5000` (Blue logs)
* **Frontend (CLIENT):** `http://localhost:5173` (Green logs)

*(Alternatively, you can run them in separate terminals via `npm run dev --prefix server` and `npm run dev --prefix client`)*

---

## 📁 Repository Structure
```
Shopping app/
├── PRD.md                       # Product Requirements Document
├── TechSpec.md                  # Technical Architecture & Spec
├── Schema.md                    # Database Schema (Prisma)
├── AppFlow.md                   # User Journeys & Sitemap
├── Design.md                    # Visual Design System
├── ImplementationPlan.md        # 10-Phase Sequential Build Plan
├── Rules.md                     # Coding Standards & Guardrails
├── Tracker.md                   # Live Progress Tracker
├── memory.md                    # Model Context Preservation Index
├── server/                      # Express Backend API
│   ├── src/
│   │   ├── config/              # Prisma & App configuration
│   │   ├── middleware/          # Centralized error & 404 handlers
│   │   ├── modules/             # Domain modules (commerce, learning, etc.)
│   │   ├── app.ts               # Express App definition
│   │   └── server.ts            # Server entry point
│   ├── prisma/                  # Prisma Schema & Migrations
│   └── package.json
└── client/                      # React + Vite Frontend
    ├── src/
    │   ├── api/                 # Axios client instance
    │   ├── components/          # Shared UI components
    │   ├── features/            # Feature-specific logic
    │   ├── pages/               # Page routes (Home health check)
    │   └── styles/              # Tailwind CSS configuration
    └── package.json
```

---


