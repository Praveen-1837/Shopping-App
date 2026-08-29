# Rules.md — Coding Conventions & AI Agent Guardrails

These rules apply to any human or AI agent (Antigravity, Claude Code, etc.) working on this codebase.

## 1. Scope Discipline
- **Work one phase at a time**, per ImplementationPlan.md. Do not start Phase N+1 work while Phase N is unreviewed.
- If a prompt asks for something outside the current phase's exit criteria, flag it rather than silently expanding scope.
- Do not scaffold placeholder/empty files for future phases "just in case" — create files when the phase that needs them arrives.

## 2. Reference Documents
Before generating code, treat these files as source of truth and stay consistent with them:
- `PRD.md` — what to build and why
- `TechSpec.md` — how it's architected (stack, folder structure, API conventions)
- `Schema.md` — exact data model (do not invent new fields/tables without updating this file first)
- `AppFlow.md` — expected user flows and page routes
- `Design.md` — visual/UX rules
If a task requires deviating from any of these, update the doc in the same change, don't let code and docs drift apart.

## 3. Backend Conventions
- All routes under `/api/v1/`.
- Every module (`commerce`, `learning`, `marketplace`, `ai`, `payments`, `impact`, `content`) is self-contained: its own routes/controller/service files. No cross-module direct DB queries — go through the owning module's service functions.
- Validate every request body with Zod before it reaches a controller.
- Never write raw SQL string concatenation — use Prisma queries/parameterization only.
- Authentication is Clerk's responsibility — never build custom password/session handling; never log Clerk session tokens or webhook payloads containing PII.
- All list endpoints must support pagination (`page`, `limit`) — no unbounded `SELECT *`.
- Error responses always follow the shape defined in TechSpec.md Section 4.

## 3a. Auth & Role Rules (Clerk)
- **Role is always read from the verified Clerk session (`req.auth.sessionClaims.publicMetadata.role`) on the backend — never trust a `role` field sent in a request body.**
- The `/api/v1/webhooks/clerk` endpoint must verify the Svix signature on every request before processing; reject unverified payloads with 401.
- Our `User.role` column is a **cache** of Clerk's `publicMetadata.role`, kept in sync via webhook — if they ever disagree, Clerk's value is the source of truth, not our DB.
- Role changes (e.g. approving a farmer/seller application) happen by updating Clerk `publicMetadata`, not by directly editing `User.role` in our DB out-of-band.

## 4. Payments-Specific Rules
- Until a real gateway is integrated, **all payment code paths must be clearly mocked** and labeled `Test Mode` in the UI.
- Payment logic lives only inside `processPayment()` (or its equivalent service function). No payment provider SDK code should leak into controllers, routes, or frontend components directly.
- Before ever removing the "Test Mode" label, complete a go-live checklist (webhook signature verification, secrets in env not code, refund flow, error/retry handling).

## 5. Frontend Conventions
- Components are functional, using hooks — no class components.
- Server state (API data) goes through TanStack Query; UI/client state through Zustand. Don't duplicate server data into Zustand.
- No inline styles — Tailwind utility classes only, following Design.md tokens once finalized.
- No emoji-as-icon; use the chosen SVG icon set consistently.
- Every data-fetching page must handle three states explicitly: loading, empty, error — not just the happy path.
- Route names must match `AppFlow.md` Section 8 sitemap exactly; don't invent alternate paths for the same page.

## 6. AI Chatbot Rules
- Responses must be grounded in retrieved catalog data (pgvector search results) — never invent products, prices, or availability.
- Function-calling tools (`add_to_cart`, `search_catalog`) are the only way the assistant modifies application state — no direct state mutation from free-form chat text.
- Chat must degrade gracefully if the LLM API is unavailable (show a clear error, don't hang indefinitely).

## 7. Git & Commit Conventions
- Branch per phase: `phase-1-foundation`, `phase-2-auth`, etc.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- No direct commits to `main` — PR per phase, reviewed against that phase's exit criteria before merge.

## 8. Testing Expectations
- New backend routes require at least one happy-path and one failure-path test (Jest + Supertest).
- Critical frontend flows (auth, cart, checkout) require at least basic component/interaction tests before Phase 10.
- Don't mark a phase "Done" in Tracker.md without its exit criteria (ImplementationPlan.md) actually verified.

## 9. Data & Privacy
- Never seed or commit real user data — seed scripts use clearly fake demo data only (create dev users via Clerk dashboard/API, not hand-inserted rows with fake `clerkId`s that don't correspond to real Clerk records).
- Environment secrets (`ANTHROPIC_API_KEY`, `DATABASE_URL`, `DIRECT_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, etc.) live only in `.env`, never committed, never hardcoded.

## 10. When the Agent Is Unsure
- If a requirement is ambiguous or conflicts between docs (e.g., PRD says X, Schema says Y), stop and surface the conflict rather than guessing and building on top of it.
- Prefer asking a scoped clarifying question over silently making an architectural decision that affects multiple future phases.
