import Anthropic from "@anthropic-ai/sdk";

const useOpenRouter = !!process.env.OPENROUTER_API_KEY;

export const claude = new Anthropic(
  useOpenRouter
    ? {
        apiKey: process.env.OPENROUTER_API_KEY ?? "",
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://venlaxiq.com",
          "X-Title": "VenlaxIQ",
        },
      }
    : { apiKey: process.env.ANTHROPIC_API_KEY ?? "" }
);

export const AI_MODEL = useOpenRouter
  ? (process.env.AI_MODEL ?? "meta-llama/llama-3.3-70b-instruct")
  : "claude-sonnet-4-6";
