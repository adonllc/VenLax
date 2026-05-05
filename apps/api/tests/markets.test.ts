import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { users } from "../src/db/schema";

describe("Markets", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    // Create an admin user and get token
    const res = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "admin@venlaxiq.com", username: "adminuser", password: "Admin123!" },
    });
    adminToken = JSON.parse(res.body).token;
  });

  afterAll(async () => { await app.close(); await closeDb(); });
  beforeEach(async () => { await resetDb(); });

  describe("POST /markets (admin create)", () => {
    it("creates a market and returns it with status draft", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/markets",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: "Will the Celtics win the 2026 NBA Championship?",
          description: "Resolves Yes if the Boston Celtics win the 2026 NBA Championship.",
          category: "sports",
          resolutionCriteria: "Official NBA.com championship page shows Celtics as winner.",
          resolutionSource: "https://www.nba.com/standings",
          closesAt: "2026-06-15T04:00:00Z",
          resolvesAt: "2026-06-16T04:00:00Z",
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.status).toBe("draft");
      expect(body.title).toBe("Will the Celtics win the 2026 NBA Championship?");
      expect(body.qYes).toBe(0);
      expect(body.qNo).toBe(0);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/markets",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { title: "Incomplete market" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /markets", () => {
    it("returns empty list when no open markets exist", async () => {
      const res = await app.inject({ method: "GET", url: "/markets" });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toEqual([]);
    });
  });

  describe("PATCH /markets/:id/status", () => {
    it("transitions market from draft to open", async () => {
      const createRes = await app.inject({
        method: "POST",
        url: "/markets",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          title: "Test Market",
          description: "Test",
          category: "sports",
          resolutionCriteria: "Test criteria",
          resolutionSource: "https://example.com",
          closesAt: "2026-06-15T04:00:00Z",
          resolvesAt: "2026-06-16T04:00:00Z",
        },
      });
      const marketId = JSON.parse(createRes.body).id;

      const patchRes = await app.inject({
        method: "PATCH",
        url: `/markets/${marketId}/status`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { status: "open" },
      });
      expect(patchRes.statusCode).toBe(200);
      expect(JSON.parse(patchRes.body).status).toBe("open");
    });
  });
});
