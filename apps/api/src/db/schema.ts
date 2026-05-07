import {
  pgTable, pgEnum, uuid, varchar, text, integer, boolean,
  timestamp, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free", "pro", "elite",
]);

export const fpPoolTypeEnum = pgEnum("fp_pool_type", [
  "daily_forecast", "earned", "bonus", "achievement", "review",
]);

export const marketStatusEnum = pgEnum("market_status", [
  "draft", "open", "closed", "resolved", "settled",
]);

export const marketCategoryEnum = pgEnum("market_category", [
  "sports", "politics", "open",
]);

export const reviewBadgeEnum = pgEnum("review_badge", [
  "none", "verified", "community_trusted",
]);

export const xpLevelEnum = pgEnum("xp_level", [
  "rookie", "analyst", "expert", "master", "legend",
]);

export const adminRoleEnum = pgEnum("admin_role", ["admin", "superadmin"]);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 320 }).notNull(),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  totpSecret: varchar("totp_secret", { length: 64 }),
  role: adminRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("admin_users_email_idx").on(t.email),
}));

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 320 }).notNull().unique(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  avatarUrl: text("avatar_url"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").notNull().default("free"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 50 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 50 }),
  passwordHash: varchar("password_hash", { length: 256 }),
  xpLevel: xpLevelEnum("xp_level").notNull().default("rookie"),
  xpTotal: integer("xp_total").notNull().default(0),
  reputationScore: integer("reputation_score").notNull().default(0),
  theme: varchar("theme", { length: 10 }).notNull().default("dark"),
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  loginStreak: integer("login_streak").notNull().default(0),
  lastLoginDate: varchar("last_login_date", { length: 10 }), // YYYY-MM-DD
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: uniqueIndex("users_email_idx").on(t.email),
  usernameIdx: uniqueIndex("users_username_idx").on(t.username),
}));

// ─── FP Ledger ───────────────────────────────────────────────────────────────
// Append-only. Never update rows. Balance = sum of non-expired entries.

export const fpLedger = pgTable("fp_ledger", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  poolType: fpPoolTypeEnum("pool_type").notNull(),
  amount: integer("amount").notNull(), // positive = credit, negative = debit
  reason: varchar("reason", { length: 100 }).notNull(),
  referenceId: uuid("reference_id"), // market_id, review_id, etc.
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("fp_ledger_user_idx").on(t.userId),
  userCreatedIdx: index("fp_ledger_user_created_idx").on(t.userId, t.createdAt),
  expiresIdx: index("fp_ledger_expires_idx").on(t.expiresAt),
}));

// ─── Markets ─────────────────────────────────────────────────────────────────

export const markets = pgTable("markets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: marketCategoryEnum("category").notNull(),
  status: marketStatusEnum("status").notNull().default("draft"),
  resolutionCriteria: text("resolution_criteria").notNull(),
  resolutionSource: varchar("resolution_source", { length: 200 }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  resolvesAt: timestamp("resolves_at", { withTimezone: true }).notNull(),
  resolvedOutcome: boolean("resolved_outcome"), // null until resolved
  resolvedById: uuid("resolved_by_id").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  creatorId: uuid("creator_id").references(() => users.id), // null for admin-created
  listingFeePaid: boolean("listing_fee_paid").notNull().default(false),
  lmsrLiquidity: integer("lmsr_liquidity").notNull().default(100), // LMSR b parameter
  qYes: integer("q_yes").notNull().default(0),
  qNo: integer("q_no").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  statusIdx: index("markets_status_idx").on(t.status),
  categoryIdx: index("markets_category_idx").on(t.category),
  closesAtIdx: index("markets_closes_at_idx").on(t.closesAt),
}));

// ─── Forecast Positions ───────────────────────────────────────────────────────

export const forecastPositions = pgTable("forecast_positions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  marketId: uuid("market_id").notNull().references(() => markets.id),
  side: boolean("side").notNull(), // true = Yes, false = No
  shares: integer("shares").notNull(), // number of shares
  fpDeployed: integer("fp_deployed").notNull(), // FP spent to acquire shares
  priceAtEntry: integer("price_at_entry").notNull(), // 1-99 probability implied
  isWithdrawn: boolean("is_withdrawn").notNull().default(false),
  isSettled: boolean("is_settled").notNull().default(false),
  fpEarned: integer("fp_earned"), // populated on settlement
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userMarketIdx: index("positions_user_market_idx").on(t.userId, t.marketId),
  marketIdx: index("positions_market_idx").on(t.marketId),
}));

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  imageUrl: text("image_url"),
  amazonAsin: varchar("amazon_asin", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  title: varchar("title", { length: 120 }).notNull(),
  body: text("body").notNull(),
  rating: integer("rating").notNull(), // 1-5
  badge: reviewBadgeEnum("badge").notNull().default("none"),
  aiTrustScore: integer("ai_trust_score"), // 0-100, internal only
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  totalVotes: integer("total_votes").notNull().default(0),
  receiptUrl: text("receipt_url"), // MinIO path
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  productIdx: index("reviews_product_idx").on(t.productId),
  userIdx: index("reviews_user_idx").on(t.userId),
  badgeIdx: index("reviews_badge_idx").on(t.badge),
}));

// ─── Audit Log ───────────────────────────────────────────────────────────────
// Immutable. All admin actions and FP adjustments logged here.

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: uuid("target_id"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  actorIdx: index("audit_actor_idx").on(t.actorId),
  actionIdx: index("audit_action_idx").on(t.action),
}));

// ─── Push Tokens ─────────────────────────────────────────────────────────────

export const pushTokens = pgTable("push_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 512 }).notNull(),
  platform: varchar("platform", { length: 10 }).notNull(), // "ios" | "android"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index("push_tokens_user_idx").on(t.userId),
  tokenIdx: uniqueIndex("push_tokens_token_idx").on(t.token),
}));

// ─── AI Insight Signals ───────────────────────────────────────────────────────

export const aiInsightSignals = pgTable("ai_insight_signals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  marketId: uuid("market_id").notNull().references(() => markets.id),
  suggestedProbability: integer("suggested_probability").notNull(), // 1–99
  confidence: integer("confidence").notNull(), // 1–5 stars
  keyFactors: text("key_factors").notNull(), // JSON string of string[]
  sourceUrls: text("source_urls").notNull(), // JSON string of string[]
  sentimentScore: integer("sentiment_score"), // -100 to 100 from HuggingFace
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  marketIdx: index("ai_signals_market_idx").on(t.marketId),
  marketCreatedIdx: index("ai_signals_market_created_idx").on(t.marketId, t.createdAt),
}));
