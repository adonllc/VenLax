import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildApp } from "../src/app";
import { testDb, resetDb, closeDb } from "./helpers/db";
import { pushTokens } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Push Notifications", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let userToken: string;
  let userId: string;

  beforeAll(async () => { app = await buildApp({ logger: false }); });
  afterAll(async () => { await app.close(); await closeDb(); });

  beforeEach(async () => {
    await resetDb();
    const regRes = await app.inject({
      method: "POST", url: "/auth/register",
      payload: { email: "push@example.com", username: "pushuser", password: "Pass123!" },
    });
    const body = JSON.parse(regRes.body);
    userToken = body.token;
    userId = body.user.id;
  });

  it("registers an iOS push token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/notifications/register-token",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { token: "abc123devicetoken", platform: "ios" },
    });
    expect(res.statusCode).toBe(201);

    const stored = await testDb.query.pushTokens.findFirst({
      where: eq(pushTokens.userId, userId),
    });
    expect(stored?.token).toBe("abc123devicetoken");
    expect(stored?.platform).toBe("ios");
  });

  it("registers an Android push token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/notifications/register-token",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { token: "fcm_device_token_xyz", platform: "android" },
    });
    expect(res.statusCode).toBe(201);
  });

  it("returns 400 for invalid platform", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/notifications/register-token",
      headers: { authorization: `Bearer ${userToken}` },
      payload: { token: "sometoken", platform: "windows" },
    });
    expect(res.statusCode).toBe(400);
  });
});
