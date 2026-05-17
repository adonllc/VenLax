import Anthropic from "@anthropic-ai/sdk";

export interface PolymarketMatch {
  polyQuestion: string;
  polyYesPercent: number;
  polyUrl: string;
}

interface PolymarketMarket {
  question: string;
  outcomePrices: string;
  slug?: string;
  conditionId?: string;
}

const useOpenRouter = !!process.env.OPENROUTER_API_KEY;
const anthropic = new Anthropic(
  useOpenRouter
    ? {
        apiKey: process.env.OPENROUTER_API_KEY ?? "",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: { "HTTP-Referer": "https://venlaxiq.com", "X-Title": "VenlaxIQ" },
      }
    : { apiKey: process.env.ANTHROPIC_API_KEY }
);
const POLY_MODEL = useOpenRouter
  ? (process.env.AI_MODEL ?? "meta-llama/llama-3.3-70b-instruct")
  : "claude-sonnet-4-6";

export async function findPolymarketMatch(
  marketTitle: string
): Promise<PolymarketMatch | null> {
  let results: PolymarketMarket[] = [];
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/markets?search=${encodeURIComponent(marketTitle)}&limit=5&active=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    results = await res.json();
  } catch {
    return null;
  }

  if (!Array.isArray(results) || results.length === 0) return null;

  let parsed: { match: number | null };
  try {
    const response = await anthropic.messages.create({
      model: POLY_MODEL,
      max_tokens: 64,
      system: "You match prediction market questions. Return valid JSON only. No markdown.",
      messages: [
        {
          role: "user",
          content: `VenlaxIQ market: "${marketTitle}"

Polymarket candidates:
${results.map((m, i) => `${i}: ${m.question}`).join("\n")}

Which index (0-${results.length - 1}) best matches with >70% conceptual similarity?
Return {"match":<index>} or {"match":null} if no good match.`,
        },
      ],
    });

    const block = response.content[0];
    if (!block || block.type !== "text") return null;
    parsed = JSON.parse(block.text);
  } catch {
    return null;
  }

  if (parsed.match === null || parsed.match === undefined) return null;
  if (parsed.match < 0 || parsed.match >= results.length) return null;

  const matched = results[parsed.match];
  if (!matched) return null;

  let polyYesPercent = 50;
  try {
    const prices: string[] = JSON.parse(matched.outcomePrices);
    if (!prices.length) return null;
    polyYesPercent = Math.round(parseFloat(prices[0]) * 100);
    if (isNaN(polyYesPercent)) return null;
  } catch {
    return null;
  }

  const slug = matched.slug ?? matched.conditionId ?? "";
  if (!slug) return null;

  return {
    polyQuestion: matched.question,
    polyYesPercent,
    polyUrl: `https://polymarket.com/event/${slug}`,
  };
}
