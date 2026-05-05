import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { resetDb, closeDb } from "./helpers/db";

describe("Auth", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => { app = await buildApp({ logger: false }); });
  afterAll(async () => { await app.close(); await closeDb(); });
  beforeEach(async () => { await resetDb(); });

  describe("POST /auth/register", () => {
    it("creates a user and returns a JWT token", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/auth/register",
        payload: { email: "test@example.com", username: "testuser", password: "Password123!" },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty("token");
      expect(body.user.email).toBe("test@example.com");
      expect(body.user.tier).toBe("free");
    });

    it("returns 409 when email already exists", async () => {
      const payload = { email: "dup@example.com", username: "user1", password: "Password123!" };
      await app.inject({ method: "POST", url: "/auth/register", payload });
      const res = await app.inject({
        method: "POST", url: "/auth/register",
        payload: { ...payload, username: "user2" },
      });
      expect(res.statusCode).toBe(409);
    });

    it("returns 400 for invalid email", async () => {
      const res = await app.inject({
        method: "POST", url: "/auth/register",
        payload: { email: "not-an-email", username: "user1", password: "Password123!" },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    it("returns JWT for valid credentials", async () => {
      await app.inject({
        method: "POST", url: "/auth/register",
        payload: { email: "login@example.com", username: "loginuser", password: "Password123!" },
      });
      const res = await app.inject({
        method: "POST", url: "/auth/login",
        payload: { email: "login@example.com", password: "Password123!" },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body)).toHaveProperty("token");
    });

    it("returns 401 for wrong password", async () => {
      await app.inject({
        method: "POST", url: "/auth/register",
        payload: { email: "wrong@example.com", username: "wronguser", password: "Password123!" },
      });
      const res = await app.inject({
        method: "POST", url: "/auth/login",
        payload: { email: "wrong@example.com", password: "WrongPassword!" },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
