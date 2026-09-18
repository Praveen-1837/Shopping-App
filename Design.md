# Design.md — Design System Reference

## 1. Design Philosophy
The platform should feel **premium but trustworthy and earthy** — not a generic "AI startup" look. It sits between a polished marketplace (Amazon/Flipkart-level UX patterns with slide-out side category drawer, sticky search header, and Amazon-style multi-column dark footer) and a warm, sustainability-focused brand (think farm-to-table, natural materials, human stories).

**Avoid:** generic AI purple/pink gradients, harsh neon colors, cold/clinical SaaS look.
**Lean into:** natural tones, soft shadows, warm neutrals, authentic photography (producers, farms, products) over stock/illustration-heavy design.

## 2. Recommended Approach: Generate via ui-ux-pro-max Skill
Once the skill is installed in Antigravity, generate the actual tailored system with:
```
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "sustainable products marketplace with learning courses" --design-system -p "[YOUR PLATFORM NAME]"
```
This produces a matched pattern, style, color palette, typography pairing, and anti-pattern checklist specific to the "Marketplace + Sustainability + E-learning" combination. Use its output to fill in Sections 3–6 below once generated — this file is a placeholder structure until that's run.

## 3. Color Palette (placeholder — replace with generated system)
| Role | Placeholder Hex | Notes |
|---|---|---|
| Primary | #2F5233 | Deep natural green — trust, sustainability |
| Secondary | #D9A566 | Warm earthy gold — farm/harvest accent |
| Background | #FAF7F2 | Warm off-white, not stark white |
| Text | #1F2421 | Near-black charcoal, not pure black |
| Success | #3A7D44 | Order/course completion states |
| Error | #B3413A | Muted red, not harsh |
| Accent (AI) | #4A7C7C | Muted teal for AI assistant elements — deliberately avoids "AI purple" cliché |
| Footer Dark BG | #1B2E1E | Deep forest charcoal green for Amazon-style dark footer body |
| Footer Strip | #27422B | Lighter forest green for "Back to top" bar |
| Footer Text Muted | #B0C2B3 | Soft leaf text for footer sublinks |

## 4. Typography (placeholder — replace with generated pairing)
- **Logo Wordmark:** Italiana (Elegant, graceful serif) — used for brand name in headers/footers.
- **Headings:** A humanist serif or rounded sans (e.g., Fraunces or Sora) — conveys warmth + credibility.
- **Body:** A clean, highly legible sans (e.g., Inter or Public Sans) — for product descriptions, course content, dashboards.

## 5. Layout Patterns (Amazon-Inspired UX Overhaul)
- **Top Navigation Header (Sticky):** Two-tier header containing:
  - *Top Tier:* Hamburger drawer trigger + brand logo, integrated search bar with attached category filter dropdown, user account state/Clerk button, quick orders/learning links, and shopping cart badge.
  - *Bottom Tier:* Horizontally scrollable quick-category shortcuts bar ("Organic Food", "Eco Living", "Artisan Crafts", "Masterclasses", "Farmer Direct", "Deals").
- **Slide-Out Side Menu (Left Category Drawer):** Slide-in side drawer triggered by top nav hamburger menu. Features user greeting header, collapsible product categories, learning links, role centre shortcuts, help & legal links, and focus trapping / Escape key close behavior.
- **Product Browsing Page (Dense & Scannable):**
  - Left-side filter bar on desktop (Category, Price Range, Sustainability Tags) that collapses to a slide-up drawer on mobile.
  - Breadcrumb navigation path (`Home / Marketplace / Category`).
  - Dense grid of `ProductCard` components featuring image, truncated title, bold price, seller badge, and hover/visible "Add to Cart" action.
- **Cart Page (Amazon-Style 2-Column Split):**
  - Left region: Line items list (`SmartCartItem`) with quantity steppers, item thumbnails, type badges, and remove actions.
  - Right region: Sticky order summary card containing subtotal, estimated shipping, tax, total, and prominent "Proceed to Checkout" button that stays visible while scrolling long lists.
- **Site Footer (Amazon-Inspired Multi-Column Layout):**
  - *Top Strip:* Full-width "Back to top" smooth-scroll button strip (`#27422B`).
  - *Main Body:* Deep forest dark background (`#1B2E1E`), 4 structured text columns (*Get to Know Us*, *Partner with Us*, *Eco-Learning & Support*, *Let Us Help You*).
  - *Bottom Bar:* Brand logo, inline language, currency (INR ₹), and country selectors, copyright notice, and social media icon set.

## 6. Key UI Components (shared library)
- TopNavbar (sticky 2-tier header with integrated search & drawer trigger)
- SideMenu (accessible slide-out category navigation drawer)
- ProductCard / CourseCard (image, title, price, rating/sustainability tag, hover Add-to-Cart)
- Footer (Amazon-inspired 4-column dark footer with Back-To-Top strip & regional selectors)
- ProducerBadge (small inline component linking to producer profile)
- TraceabilityTimeline (Farm → Processing → Packaging → Seller → Customer, horizontal stepper)
- SmartCartItem (distinguishes physical vs digital with icon/label & quantity stepper)
- ChatWidget (floating, expandable, streaming responses)

## 7. Responsive Breakpoints
| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | 375px | Single column, slide-out drawer primary nav, mobile filter modal |
| Tablet | 768px | 2-3 column grids where applicable |
| Laptop | 1024px | Desktop sidebar filter + dense 3-4 column grid |
| Desktop | 1440px | Max content width ~1280px, centered layout |

## 8. Accessibility Checklist (apply to every page)
- [ ] No emojis used as functional icons — use SVG icon set (Heroicons/Lucide/Phosphor)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Text contrast ≥ 4.5:1 in light mode
- [ ] Visible focus states for keyboard navigation
- [ ] `prefers-reduced-motion` respected for animations
- [ ] Chips/badges/labels reflow without clipping at narrow widths
- [ ] Interactive elements have accessible names (not icon-only without `aria-label`)
- [ ] Slide-out menu traps focus when open and closes on `Escape` key or backdrop click (`aria-label="Side category menu"`)
- [ ] Footer "Back to top" is an accessible `<button>` element with `aria-label="Back to top"`

## 9. Voice & Tone (UI copy)
- Warm, plain language — avoid corporate jargon ("Meet the Producer" not "Vendor Profile").
- AI assistant responses should sound like a knowledgeable, friendly guide — not a generic chatbot script.

## 10. Next Step
Run the ui-ux-pro-max design-system generator (Section 2) and paste its output into Sections 3–6, replacing these placeholders, before Phase 1 UI work begins.
