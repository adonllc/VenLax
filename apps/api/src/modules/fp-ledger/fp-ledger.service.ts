import { and, eq, gt, isNull, or, sql, sum } from "drizzle-orm";
import { fpLedger } from "../../db/schema";
import type { DB } from "../../db";

type FpPoolType = "daily_forecast" | "earned" | "bonus" | "achievement" | "review";

interface CreditParams {
  userId: string;
  poolType: FpPoolType;
  amount: number;
  reason: string;
  referenceId?: string;
  expiresInDays: number;
}

interface DebitParams {
  userId: string;
  poolType: FpPoolType;
  amount: number;
  reason: string;
  referenceId?: string;
}

interface FpBalance {
  daily_forecast: number;
  earned: number;
  bonus: number;
  achievement: number;
  review: number;
  total: number;
}

function expiryDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const notExpired = and(
  or(isNull(fpLedger.expiresAt), gt(fpLedger.expiresAt, sql`NOW()`))
);

export async function getBalance(db: DB, userId: string): Promise<FpBalance> {
  const rows = await db
    .select({
      poolType: fpLedger.poolType,
      total: sum(fpLedger.amount).mapWith(Number),
    })
    .from(fpLedger)
    .where(and(eq(fpLedger.userId, userId), notExpired))
    .groupBy(fpLedger.poolType);

  const balance: FpBalance = {
    daily_forecast: 0, earned: 0, bonus: 0, achievement: 0, review: 0, total: 0,
  };

  for (const row of rows) {
    const pool = row.poolType as FpPoolType;
    const amount = row.total ?? 0;
    balance[pool] = amount;
    balance.total += amount;
  }

  return balance;
}

export async function getBalanceByPool(db: DB, userId: string, pool: FpPoolType): Promise<number> {
  const balance = await getBalance(db, userId);
  return balance[pool];
}

export async function creditFp(db: DB, params: CreditParams): Promise<void> {
  if (params.amount <= 0) throw new Error("Credit amount must be positive");

  await db.insert(fpLedger).values({
    userId: params.userId,
    poolType: params.poolType,
    amount: params.amount,
    reason: params.reason,
    referenceId: params.referenceId,
    expiresAt: expiryDate(params.expiresInDays),
  });
}

export async function debitFp(db: DB, params: DebitParams): Promise<void> {
  if (params.amount <= 0) throw new Error("Debit amount must be positive");

  const current = await getBalanceByPool(db, params.userId, params.poolType);
  if (current < params.amount) throw new Error("Insufficient FP balance");

  await db.insert(fpLedger).values({
    userId: params.userId,
    poolType: params.poolType,
    amount: -params.amount,
    reason: params.reason,
    referenceId: params.referenceId,
    expiresAt: null, // debits don't expire
  });
}
