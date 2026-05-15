ALTER TABLE "markets" ADD COLUMN IF NOT EXISTS "source" varchar(20) NOT NULL DEFAULT 'user';
