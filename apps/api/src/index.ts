import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { buildApp } from "./app";
import { db } from "./db";
import { startWorkers } from "./jobs/worker-registry";

const PORT = Number(process.env.API_PORT ?? 3001);

async function main() {
  await migrate(db, { migrationsFolder: "./migrations" });
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
