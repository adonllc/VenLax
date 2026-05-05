import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { db } from "../../db";
import { getBalance } from "./fp-ledger.service";

export async function fpLedgerRoutes(app: FastifyInstance) {
  app.get(
    "/fp/balance",
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const balance = await getBalance(db, sub);
      return reply.code(200).send(balance);
    }
  );
}
