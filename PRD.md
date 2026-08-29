# PRD.md — Product Requirements Document

## 1. Product Name
[YOUR PLATFORM NAME] — a multi-vendor e-commerce & digital learning ecosystem.

## 2. Vision
Build a world-class platform combining commerce, learning, AI-powered discovery, producer stories, traceability, community and measurable sustainability impact — comparable in polish and scale to Amazon/Flipkart/Myntra, but differentiated by a focus on sustainable products, farmers, artisans, and knowledge.

**Positioning statement:** SHOP + LEARN + DISCOVER + CONNECT + IMPACT.

## 3. Target Users
| Persona | Description | Primary Needs |
|---|---|---|
| Customer | Everyday shopper/learner | Fast discovery, trustworthy products, easy checkout, learning access |
| Farmer/Producer | Sells farm produce, seeds, organic goods | Simple listing (voice-assisted), fair visibility, direct sales, payouts |
| Artisan | Sells handicrafts/traditional products | Storefront, storytelling, order management |
| Eco Brand Seller | Sells sustainable/reusable products | Inventory & catalog tools, analytics |
| Educator | Sells courses, workshops, videos | Course authoring, student progress tracking, payouts |
| Admin | Platform operator | Moderation, analytics, seller/farmer approvals, dispute resolution |

## 4. Core Modules (from platform spec)
1. Auth & Role-Based Users (customer, seller, farmer, artisan, educator, admin)
2. Product Catalog & Multi-Vendor Marketplace
3. Course Catalog & Learning Engine
4. Smart Cart & One-Checkout (physical + digital in one cart)
5. Payment Gateway Page (placeholder now, real integration later)
6. Order & Learning Lifecycle Tracking
7. AI Shopping Assistant (conversational discovery, recommendations, add-to-cart)
8. Producer Profiles & Product Traceability (Farm → Processing → Packaging → Seller → Customer)
9. User Dashboard ("My World": orders, courses, certificates, wishlist, impact, rewards)
10. Seller / Farmer / Educator Centres (dashboards for listing, orders, payouts, analytics)
11. Subscriptions (farm boxes, recurring eco-deliveries, learning subscriptions)
12. Live Commerce (live-from-the-farm, live workshops)
13. Community (following producers, reviews, discussions, challenges)
14. Gamification & Eco-Points

## 5. Key Differentiators
- **Product + Learning bundling** — e.g. "Kitchen Garden Starter Kit" + "Kitchen Gardening Course" sold together.
- **AI Shopping Assistant** — natural-language discovery ("I want to start terrace gardening") returns a complete curated bundle (products + course + videos), addable to cart in one action.
- **Traceability** — customers can see a product's journey from farm to delivery.
- **My Impact dashboard** — translates purchases/learning into a personal sustainability scorecard (farmers supported, plastic avoided, ₹ spent directly with producers, courses completed).

## 6. User Stories (representative sample)
- As a customer, I want to search in natural language so I can find relevant products/courses without browsing categories.
- As a customer, I want one cart and one checkout for both physical products and digital courses.
- As a customer, I want to see who grew/made my product and its journey to me.
- As a farmer, I want to list a product by speaking in my regional language so I don't need to type a full listing.
- As a learner, I want my purchased course to activate immediately after payment and let me resume where I left off.
- As a seller, I want a dashboard showing my orders, inventory, and sales performance.
- As any user, I want a chatbot that can recommend a complete solution bundle and add it to my cart directly.

## 7. Success Metrics (initial, to refine later)
- Checkout completion rate (cart → paid order)
- Course completion rate
- AI assistant engagement rate (chat sessions → add-to-cart conversion)
- Seller/farmer onboarding completion rate
- Repeat purchase rate
- Average "My Impact" score growth per active user

## 8. Out of Scope for MVP
- Live commerce (streaming) — phase 2+
- Full multi-language voice listing — start with text; voice is phase 2+
- Real payment gateway integration — placeholder page only for MVP (see TechSpec.md, ImplementationPlan.md)
- Advanced gamification (challenges, leaderboards) — phase 2+
- Mobile native apps — web-first, mobile-responsive

## 9. Assumptions
- Single currency (INR) and single primary region at MVP.
- Sellers/farmers/educators are manually or semi-automatically approved by admin before going live.
- AI assistant uses an LLM API (Claude) with catalog-grounded retrieval, not open-ended chat.

## 10. Non-Goals
- Not a general-purpose social network — community features stay commerce/learning-adjacent.
- Not attempting full ERP/inventory-management depth at MVP — basic stock tracking only.
