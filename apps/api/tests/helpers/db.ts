import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../src/db/schema";
import { sql } from "drizzle-orm";

const testPool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL ??
    "postgresql://test:test@localhost:5433/venlaxiq_test",
});

export const testDb = drizzle(testPool, { schema });

export async function resetDb() {
  await testDb.execute(sql`
    TRUNCATE TABLE audit_log, forecast_positions, reviews, products,
                   fp_ledger, markets, users RESTART IDENTITY CASCADE
  `);
}

export async function closeDb() {
  await testPool.end();
}
