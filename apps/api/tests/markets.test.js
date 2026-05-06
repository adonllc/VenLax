"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const app_1 = require("../src/app");
const db_1 = require("./helpers/db");
(0, vitest_1.describe)("Markets", () => {
    let app;
    let adminToken;
    (0, vitest_1.beforeAll)(async () => {
        app = await (0, app_1.buildApp)({ logger: false });
        // Create an admin user and get token
        const res = await app.inject({
            method: "POST", url: "/auth/register",
            payload: { email: "admin@venlaxiq.com", username: "adminuser", password: "Admin123!" },
        });
        adminToken = JSON.parse(res.body).token;
    });
    (0, vitest_1.afterAll)(async () => { await app.close(); await (0, db_1.closeDb)(); });
    (0, vitest_1.beforeEach)(async () => { await (0, db_1.resetDb)(); });
    (0, vitest_1.describe)("POST /markets (admin create)", () => {
        (0, vitest_1.it)("creates a market and returns it with status draft", async () => {
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
            (0, vitest_1.expect)(res.statusCode).toBe(201);
            const body = JSON.parse(res.body);
            (0, vitest_1.expect)(body.status).toBe("draft");
            (0, vitest_1.expect)(body.title).toBe("Will the Celtics win the 2026 NBA Championship?");
            (0, vitest_1.expect)(body.qYes).toBe(0);
            (0, vitest_1.expect)(body.qNo).toBe(0);
        });
        (0, vitest_1.it)("returns 400 for missing required fields", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/markets",
                headers: { authorization: `Bearer ${adminToken}` },
                payload: { title: "Incomplete market" },
            });
            (0, vitest_1.expect)(res.statusCode).toBe(400);
        });
    });
    (0, vitest_1.describe)("GET /markets", () => {
        (0, vitest_1.it)("returns empty list when no open markets exist", async () => {
            const res = await app.inject({ method: "GET", url: "/markets" });
            (0, vitest_1.expect)(res.statusCode).toBe(200);
            (0, vitest_1.expect)(JSON.parse(res.body)).toEqual([]);
        });
    });
    (0, vitest_1.describe)("PATCH /markets/:id/status", () => {
        (0, vitest_1.it)("transitions market from draft to open", async () => {
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
            (0, vitest_1.expect)(patchRes.statusCode).toBe(200);
            (0, vitest_1.expect)(JSON.parse(patchRes.body).status).toBe("open");
        });
    });
});
