"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const app_1 = require("../src/app");
const db_1 = require("./helpers/db");
(0, vitest_1.describe)("Auth", () => {
    let app;
    (0, vitest_1.beforeAll)(async () => { app = await (0, app_1.buildApp)({ logger: false }); });
    (0, vitest_1.afterAll)(async () => { await app.close(); await (0, db_1.closeDb)(); });
    (0, vitest_1.beforeEach)(async () => { await (0, db_1.resetDb)(); });
    (0, vitest_1.describe)("POST /auth/register", () => {
        (0, vitest_1.it)("creates a user and returns a JWT token", async () => {
            const res = await app.inject({
                method: "POST",
                url: "/auth/register",
                payload: { email: "test@example.com", username: "testuser", password: "Password123!" },
            });
            (0, vitest_1.expect)(res.statusCode).toBe(201);
            const body = JSON.parse(res.body);
            (0, vitest_1.expect)(body).toHaveProperty("token");
            (0, vitest_1.expect)(body.user.email).toBe("test@example.com");
            (0, vitest_1.expect)(body.user.tier).toBe("free");
        });
        (0, vitest_1.it)("returns 409 when email already exists", async () => {
            const payload = { email: "dup@example.com", username: "user1", password: "Password123!" };
            await app.inject({ method: "POST", url: "/auth/register", payload });
            const res = await app.inject({
                method: "POST", url: "/auth/register",
                payload: { ...payload, username: "user2" },
            });
            (0, vitest_1.expect)(res.statusCode).toBe(409);
        });
        (0, vitest_1.it)("returns 400 for invalid email", async () => {
            const res = await app.inject({
                method: "POST", url: "/auth/register",
                payload: { email: "not-an-email", username: "user1", password: "Password123!" },
            });
            (0, vitest_1.expect)(res.statusCode).toBe(400);
        });
    });
    (0, vitest_1.describe)("POST /auth/login", () => {
        (0, vitest_1.it)("returns JWT for valid credentials", async () => {
            await app.inject({
                method: "POST", url: "/auth/register",
                payload: { email: "login@example.com", username: "loginuser", password: "Password123!" },
            });
            const res = await app.inject({
                method: "POST", url: "/auth/login",
                payload: { email: "login@example.com", password: "Password123!" },
            });
            (0, vitest_1.expect)(res.statusCode).toBe(200);
            (0, vitest_1.expect)(JSON.parse(res.body)).toHaveProperty("token");
        });
        (0, vitest_1.it)("returns 401 for wrong password", async () => {
            await app.inject({
                method: "POST", url: "/auth/register",
                payload: { email: "wrong@example.com", username: "wronguser", password: "Password123!" },
            });
            const res = await app.inject({
                method: "POST", url: "/auth/login",
                payload: { email: "wrong@example.com", password: "WrongPassword!" },
            });
            (0, vitest_1.expect)(res.statusCode).toBe(401);
        });
    });
});
