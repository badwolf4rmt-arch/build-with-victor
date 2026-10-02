import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Streams a Responses call through Lovable AI Gateway and returns the final text. */
export async function generateText(system: string, prompt: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new GatewayError(401, "ИИ не настроен");

  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });

  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    system,
    prompt,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = await result.text.catch((e) => {
    failure ??= e;
    return "";
  });
  if (failure) {
    const status = (failure as { statusCode?: number }).statusCode ?? 500;
    if (status === 402) throw new GatewayError(402, "Закончились кредиты ИИ. Пополните баланс в настройках.");
    if (status === 429) throw new GatewayError(429, "Слишком много запросов. Попробуйте через минуту.");
    throw new GatewayError(status, "ИИ временно недоступен");
  }
  return text;
}
