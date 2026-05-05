import { FastifyInstance } from "fastify";
import { authenticate } from "../../plugins/authenticate";
import { enterForecastSchema } from "./forecast.schema";
import { enterForecast, getPositions, withdrawForecast } from "./forecast.service";

export async function forecastRoutes(app: FastifyInstance) {
  app.post("/forecast/enter", { preHandler: [authenticate] }, async (request, reply) => {
    const result = enterForecastSchema.safeParse(request.body);
    if (!result.success) return reply.code(400).send({ error: result.error.flatten() });
    const { sub } = request.user as { sub: string };
    try {
      const position = await enterForecast(sub, result.data);
      return reply.code(201).send(position);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });

  app.get("/forecast/positions", { preHandler: [authenticate] }, async (request, reply) => {
    const { sub } = request.user as { sub: string };
    return reply.send(await getPositions(sub));
  });

  app.post("/forecast/:id/withdraw", { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { sub } = request.user as { sub: string };
    try {
      const position = await withdrawForecast(id, sub);
      return reply.send(position);
    } catch (err: any) {
      return reply.code(err.statusCode ?? 500).send({ error: err.message });
    }
  });
}
