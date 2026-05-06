"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const app_1 = require("../src/app");
(0, vitest_1.describe)("GET /health", () => {
    let app;
    (0, vitest_1.beforeAll)(async () => {
        app = await (0, app_1.buildApp)({ logger: false });
    });
    (0, vitest_1.afterAll)(async () => {
        await app.close();
    });
    (0, vitest_1.it)("returns 200 with status ok", async () => {
        const res = await app.inject({ method: "GET", url: "/health" });
        (0, vitest_1.expect)(res.statusCode).toBe(200);
        (0, vitest_1.expect)(JSON.parse(res.body)).toEqual({ status: "ok" });
    });
});
