import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from "./subscriptions.service";
import { authenticate } from "../../plugins/authenticate";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-04-10",
});

export async function subscriptionRoutes(app: FastifyInstance) {
  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (req, body, done) => done(null, body)
  );

  app.post("/webhooks/stripe", async (request, reply) => {
    const sig = request.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET ?? ""
      );
    } catch {
      return reply.code(400).send({ error: "Invalid webhook signature" });
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated({
          customerId: sub.customer as string,
          subscriptionId: sub.id,
          priceId: sub.items.data[0]?.price.id ?? "",
          status: sub.status,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted({ customerId: sub.customer as string });
        break;
      }
    }

    return reply.code(200).send({ received: true });
  });

  app.post("/subscriptions/checkout", { preHandler: [authenticate] }, async (request, reply) => {
    const { tier } = request.body as { tier: "pro" | "elite" };
    const userId = (request as any).user.sub;
    const PRICE_IDS: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO ?? "price_pro_placeholder",
      elite: process.env.STRIPE_PRICE_ELITE ?? "price_elite_placeholder",
    };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
      success_url: `${process.env.WEB_URL ?? "http://localhost:3000"}/settings/subscription?success=1`,
      cancel_url: `${process.env.WEB_URL ?? "http://localhost:3000"}/settings/subscription`,
      client_reference_id: userId,
    });
    return reply.send({ url: session.url });
  });
}
