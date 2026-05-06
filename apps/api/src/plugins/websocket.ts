import websocket from "@fastify/websocket";
import { FastifyInstance } from "fastify";

// Use a structural interface matching the ws.WebSocket API surface we need
interface WSClient {
  readyState: number;
  send(data: string): void;
  on(event: "close", listener: () => void): this;
}

const subscribers = new Map<string, Set<WSClient>>();

export function subscribe(marketId: string, ws: WSClient): void {
  if (!subscribers.has(marketId)) {
    subscribers.set(marketId, new Set());
  }
  subscribers.get(marketId)!.add(ws);
  ws.on("close", () => subscribers.get(marketId)?.delete(ws));
}

export function broadcastProbability(marketId: string, probability: number): void {
  const clients = subscribers.get(marketId);
  if (!clients) return;
  const message = JSON.stringify({ type: "probability_update", marketId, probability });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

export async function websocketPlugin(app: FastifyInstance): Promise<void> {
  await app.register(websocket);

  app.get("/ws/markets/:id", { websocket: true }, (socket, request) => {
    const { id } = request.params as { id: string };
    subscribe(id, socket as unknown as WSClient);
  });
}
