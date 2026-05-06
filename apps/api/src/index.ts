import "dotenv/config";
import { buildApp } from "./app";
import { startWorkers } from "./jobs/worker-registry";

const PORT = Number(process.env.API_PORT ?? 3001);

async function main() {
  const app = await buildApp();
  await startWorkers();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`VenlaxIQ API running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
