import "dotenv/config";
import { seedRewardCatalog } from "../src/modules/rewards/rewards.service";

async function main() {
  await seedRewardCatalog();
  console.log("Reward catalog seeded.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
