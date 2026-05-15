import "dotenv/config";
import { db } from "../src/db";
import { markets } from "../src/db/schema";

const SAMPLE_MARKETS = [
  {
    title: "Will the Federal Reserve cut interest rates before September 2026?",
    description:
      "The Federal Reserve has held rates steady amid persistent inflation concerns. Markets are watching closely for any pivot signal from Fed Chair Powell and FOMC meeting minutes.",
    category: "politics" as const,
    resolutionCriteria:
      "YES if the Federal Reserve announces at least one federal funds rate cut at any FOMC meeting on or before September 30, 2026. Resolves NO otherwise.",
    resolutionSource: "Federal Reserve (federalreserve.gov)",
    closesAt: new Date("2026-09-30T23:59:59Z"),
    resolvesAt: new Date("2026-10-07T23:59:59Z"),
  },
  {
    title: "Will OpenAI release GPT-5 to the public before August 2026?",
    description:
      "OpenAI has been rumored to be working on GPT-5 with significantly improved reasoning capabilities. The AI industry is watching for any public announcement or product release.",
    category: "open" as const,
    resolutionCriteria:
      "YES if OpenAI publicly releases a model officially named GPT-5 (or equivalent successor announced as such) with general availability before August 1, 2026. Resolves NO otherwise.",
    resolutionSource: "OpenAI official announcements (openai.com)",
    closesAt: new Date("2026-07-31T23:59:59Z"),
    resolvesAt: new Date("2026-08-07T23:59:59Z"),
  },
];

async function main() {
  console.log("Seeding sample markets...");

  for (const m of SAMPLE_MARKETS) {
    const [inserted] = await db
      .insert(markets)
      .values({
        ...m,
        status: "open",
        source: "admin",
        lmsrLiquidity: 100,
        listingFeePaid: true,
        creatorId: null,
      })
      .returning({ id: markets.id, title: markets.title });

    console.log(`✓ Created: "${inserted.title}" (${inserted.id})`);
  }

  console.log("\nDone. Visit /markets to see them live.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
