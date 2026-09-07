# Schema.md — Database Schema (PostgreSQL + Prisma)

## 1. Entity Overview
```
users ──< products (as seller)
users ──< courses (as educator)
users ──< producers (1:1 profile for farmer/artisan)
users ──< orders
orders ──< order_items >── products / courses
users ──< carts (1:1 active cart)
users ──< course_progress >── courses
users ──< reviews >── products / courses
users ──< subscriptions
users ──< impact_metrics (1:1, aggregated)
products ──< product_embeddings (pgvector)
courses ──< course_embeddings (pgvector)
```

## 2. Prisma Schema (initial draft)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Supabase pooled connection (pgbouncer)
  directUrl = env("DIRECT_URL")     // Supabase direct connection, used for migrations
}

enum Role {
  CUSTOMER
  SELLER
  FARMER
  ARTISAN
  EDUCATOR
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PACKED
  SHIPPED
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
}

model User {
  id            String    @id @default(uuid())
  clerkId       String    @unique   // maps to Clerk's user.id — source of identity
  name          String
  email         String    @unique
  role          Role      @default(CUSTOMER)  // mirrors Clerk publicMetadata.role, kept in sync via webhook
  phone         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  products      Product[]        @relation("SellerProducts")
  courses       Course[]         @relation("EducatorCourses")
  producer      Producer?
  orders        Order[]
  cart          Cart?
  reviews       Review[]
  courseProgress CourseProgress[]
  subscriptions Subscription[]
  impactMetrics ImpactMetrics?
}

model Producer {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  name        String
  location    String
  story       String?
  practices   String?
  photos      String[]
  createdAt   DateTime @default(now())

  products    Product[]
}

model Product {
  id                 String   @id @default(uuid())
  sellerId           String
  seller             User     @relation("SellerProducts", fields: [sellerId], references: [id])
  producerId         String?
  producer           Producer? @relation(fields: [producerId], references: [id])
  title              String
  description        String
  price              Decimal
  category           String
  stock              Int      @default(0)
  images             String[]
  sustainabilityTags String[]
  traceabilityStages Json?     // Farm -> Processing -> Packaging -> Seller -> Customer
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  orderItems         OrderItem[]
  reviews            Review[]
  embedding          ProductEmbedding?

  @@index([category])
  @@index([sellerId])
}

model Course {
  id            String   @id @default(uuid())
  educatorId    String
  educator      User     @relation("EducatorCourses", fields: [educatorId], references: [id])
  title         String
  description   String
  price         Decimal
  durationMins  Int
  modules       Json      // [{ id, title, videoUrl, order }]
  previewVideo  String?
  certificate   Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  orderItems    OrderItem[]
  reviews       Review[]
  progress      CourseProgress[]
  embedding     CourseEmbedding?

  @@index([educatorId])
}

model Cart {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  items     Json      // [{ productId | courseId, quantity, type }]
  updatedAt DateTime @updatedAt
}

model Order {
  id            String        @id @default(uuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  status        OrderStatus   @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  paymentId     String?
  cancellationReason String?
  total         Decimal
  deliveryAddress Json?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  items         OrderItem[]
}

model OrderItem {
  id         String   @id @default(uuid())
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id])
  productId  String?
  product    Product? @relation(fields: [productId], references: [id])
  courseId   String?
  course     Course?  @relation(fields: [courseId], references: [id])
  quantity   Int      @default(1)
  price      Decimal
  itemType   String   // "PRODUCT" | "COURSE"
}

model CourseProgress {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  courseId          String
  course            Course   @relation(fields: [courseId], references: [id])
  completedModules  String[]
  progressPercent   Int      @default(0)
  certificateIssued Boolean  @default(false)
  updatedAt         DateTime @updatedAt

  @@unique([userId, courseId])
}

model Review {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  courseId  String?
  course    Course?  @relation(fields: [courseId], references: [id])
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
}

model Subscription {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  plan         String
  status       String   @default("ACTIVE")
  renewalDate  DateTime?
  createdAt    DateTime @default(now())
}

model ImpactMetrics {
  id                     String   @id @default(uuid())
  userId                 String   @unique
  user                   User     @relation(fields: [userId], references: [id])
  farmersSupported       Int      @default(0)
  plasticAvoidedKg       Decimal  @default(0)
  amountSpentWithProducers Decimal @default(0)
  coursesCompleted       Int      @default(0)
  ecoPoints              Int      @default(0)
  updatedAt              DateTime @updatedAt
}

// --- AI / pgvector embeddings ---
// Requires: CREATE EXTENSION IF NOT EXISTS vector;

model ProductEmbedding {
  id         String                  @id @default(uuid())
  productId  String                  @unique
  product    Product                 @relation(fields: [productId], references: [id])
  embedding  Unsupported("vector(1536)")
}

model CourseEmbedding {
  id         String                  @id @default(uuid())
  courseId   String                  @unique
  course     Course                  @relation(fields: [courseId], references: [id])
  embedding  Unsupported("vector(1536)")
}
```

## 2a. Clerk Sync Notes
- `User.passwordHash` is **removed** — Clerk owns credentials/sessions entirely.
- `User.clerkId` is the join key between Clerk and our database; every other table still relates to `User.id` (our internal UUID), not `clerkId` directly, so schema/relations stay stack-agnostic if auth providers ever change.
- Row lifecycle: created on Clerk's `user.created` webhook, updated on `user.updated` (e.g. role change via `publicMetadata`), removed (or soft-deleted, per your preference) on `user.deleted`.

## 3. Indexing Notes
- `products.category`, `products.sellerId` — indexed for catalog browsing/filtering.
- `courses.educatorId` — indexed for dashboard queries.
- `orders.userId`, `orders.status` — indexed for order history and fulfillment queries.
- pgvector: use an IVFFlat or HNSW index on `embedding` columns once data volume justifies it (not needed at seed-data scale).

## 4. Migration & Seeding Workflow
```bash
npx prisma migrate dev --name init
npx prisma db seed        # runs prisma/seed.ts — sample products, courses, producers, demo users
```

## 5. Open Schema Questions (resolve before Phase 3)
- Do farmers/artisans/eco-brands need separate tables, or does `Producer` + `Product.category` cover the distinction? (Current draft: one `Producer` table, differentiated by tags/category.)
- Multi-currency support — deferred, single currency (INR) assumed for MVP schema.
- Soft-delete vs hard-delete for products/courses — recommend adding `deletedAt DateTime?` before Phase 3 if needed.
