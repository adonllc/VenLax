DO $$ BEGIN
 CREATE TYPE "public"."admin_role" AS ENUM('admin', 'superadmin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."fp_pool_type" AS ENUM('daily_forecast', 'earned', 'bonus', 'achievement', 'review');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."market_category" AS ENUM('sports', 'politics', 'open');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."market_status" AS ENUM('draft', 'open', 'closed', 'resolved', 'settled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."review_badge" AS ENUM('none', 'verified', 'community_trusted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'elite');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."xp_level" AS ENUM('rookie', 'analyst', 'expert', 'master', 'legend');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(256) NOT NULL,
	"totp_secret" varchar(64),
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_insight_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"suggested_probability" integer NOT NULL,
	"confidence" integer NOT NULL,
	"key_factors" text NOT NULL,
	"source_urls" text NOT NULL,
	"sentiment_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forecast_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"side" boolean NOT NULL,
	"shares" integer NOT NULL,
	"fp_deployed" integer NOT NULL,
	"price_at_entry" integer NOT NULL,
	"is_withdrawn" boolean DEFAULT false NOT NULL,
	"is_settled" boolean DEFAULT false NOT NULL,
	"fp_earned" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fp_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pool_type" "fp_pool_type" NOT NULL,
	"amount" integer NOT NULL,
	"reason" varchar(100) NOT NULL,
	"reference_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" "market_category" NOT NULL,
	"status" "market_status" DEFAULT 'draft' NOT NULL,
	"resolution_criteria" text NOT NULL,
	"resolution_source" varchar(200) NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"resolves_at" timestamp with time zone NOT NULL,
	"resolved_outcome" boolean,
	"resolved_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"creator_id" uuid,
	"listing_fee_paid" boolean DEFAULT false NOT NULL,
	"lmsr_liquidity" integer DEFAULT 100 NOT NULL,
	"q_yes" integer DEFAULT 0 NOT NULL,
	"q_no" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"brand" varchar(100),
	"image_url" text,
	"amazon_asin" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "push_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(512) NOT NULL,
	"platform" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(120) NOT NULL,
	"body" text NOT NULL,
	"rating" integer NOT NULL,
	"badge" "review_badge" DEFAULT 'none' NOT NULL,
	"ai_trust_score" integer,
	"helpful_votes" integer DEFAULT 0 NOT NULL,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"receipt_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"username" varchar(30) NOT NULL,
	"phone" varchar(20),
	"phone_verified" boolean DEFAULT false NOT NULL,
	"avatar_url" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" varchar(50),
	"stripe_subscription_id" varchar(50),
	"password_hash" varchar(256),
	"xp_level" "xp_level" DEFAULT 'rookie' NOT NULL,
	"xp_total" integer DEFAULT 0 NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"theme" varchar(10) DEFAULT 'dark' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"login_streak" integer DEFAULT 0 NOT NULL,
	"last_login_date" varchar(10),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_insight_signals" ADD CONSTRAINT "ai_insight_signals_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forecast_positions" ADD CONSTRAINT "forecast_positions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "forecast_positions" ADD CONSTRAINT "forecast_positions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fp_ledger" ADD CONSTRAINT "fp_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "markets" ADD CONSTRAINT "markets_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "markets" ADD CONSTRAINT "markets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_idx" ON "admin_users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_signals_market_idx" ON "ai_insight_signals" ("market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_signals_market_created_idx" ON "ai_insight_signals" ("market_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_actor_idx" ON "audit_log" ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_action_idx" ON "audit_log" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "positions_user_market_idx" ON "forecast_positions" ("user_id","market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "positions_market_idx" ON "forecast_positions" ("market_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fp_ledger_user_idx" ON "fp_ledger" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fp_ledger_user_created_idx" ON "fp_ledger" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fp_ledger_expires_idx" ON "fp_ledger" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_status_idx" ON "markets" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_category_idx" ON "markets" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "markets_closes_at_idx" ON "markets" ("closes_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "push_tokens_user_idx" ON "push_tokens" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "push_tokens_token_idx" ON "push_tokens" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_product_idx" ON "reviews" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_user_idx" ON "reviews" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_badge_idx" ON "reviews" ("badge");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");