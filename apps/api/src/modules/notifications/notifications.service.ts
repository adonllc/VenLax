import { eq } from "drizzle-orm";
import { db } from "../../db";
import { pushTokens } from "../../db/schema";
import { notificationQueue } from "../../queue";

export interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function queueNotification(payload: PushPayload): Promise<void> {
  await notificationQueue.add("send-push", payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function registerToken(
  userId: string,
  token: string,
  platform: "ios" | "android"
): Promise<void> {
  const existing = await db.query.pushTokens.findFirst({
    where: eq(pushTokens.token, token),
  });

  if (existing) {
    await db.update(pushTokens)
      .set({ userId })
      .where(eq(pushTokens.token, token));
  } else {
    await db.insert(pushTokens).values({ userId, token, platform });
  }
}

export async function getUserTokens(userId: string) {
  return db.query.pushTokens.findMany({ where: eq(pushTokens.userId, userId) });
}

export async function deliverPush(payload: PushPayload): Promise<void> {
  const tokens = await getUserTokens(payload.userId);
  if (tokens.length === 0) return;

  const iosTokens = tokens.filter(t => t.platform === "ios").map(t => t.token);
  const androidTokens = tokens.filter(t => t.platform === "android").map(t => t.token);

  if (iosTokens.length > 0) {
    await sendApns(iosTokens, payload.title, payload.body, payload.data);
  }
  if (androidTokens.length > 0) {
    await sendFcm(androidTokens, payload.title, payload.body, payload.data);
  }
}

async function sendApns(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const apn = await import("@parse/node-apn");

  const provider = new apn.Provider({
    token: {
      key: process.env.APNS_KEY_PATH ?? "",
      keyId: process.env.APNS_KEY_ID ?? "",
      teamId: process.env.APNS_TEAM_ID ?? "",
    },
    production: process.env.NODE_ENV === "production",
  });

  const notification = new apn.Notification();
  notification.expiry = Math.floor(Date.now() / 1000) + 3600;
  notification.badge = 1;
  notification.sound = "default";
  notification.alert = { title, body };
  notification.topic = process.env.APNS_BUNDLE_ID ?? "com.venlaxiq";
  if (data) notification.payload = data;

  await provider.send(notification, tokens);
  provider.shutdown();
}

async function sendFcm(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const admin = await import("firebase-admin");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        clientEmail: process.env.FCM_CLIENT_EMAIL,
        privateKey: (process.env.FCM_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      } as any),
    });
  }

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });
}
