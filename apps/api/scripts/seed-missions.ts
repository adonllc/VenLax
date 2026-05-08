import "dotenv/config";
import { db } from "../src/db";
import { missions } from "../src/db/schema";

async function main() {
  const items = [
    { title: "First Forecast of the Day", description: "Make any forecast today", fpReward: 25, xpReward: 10 },
    { title: "Review a Product", description: "Submit a product review", fpReward: 50, xpReward: 20 },
    { title: "Check the Leaderboard", description: "Visit the leaderboard today", fpReward: 10, xpReward: 5 },
    { title: "Vote on 3 Reviews", description: "Mark 3 reviews as helpful or not", fpReward: 15, xpReward: 5 },
    { title: "View an AI Insight", description: "Open an AI signal on any market", fpReward: 20, xpReward: 10 },
  ];
  await db.insert(missions).values(items).onConflictDoNothing();
  console.log("Missions seeded.");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
