const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-pro-preview";

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls OpenRouter chat completions and returns the final text. */
export type AiFile = { name: string; dataUrl: string };

export async function generateText(system: string, prompt: string, files: AiFile[] = []): Promise<string> {
  const userContent = files.length
    ? [
        { type: "text", text: prompt },
        ...files.map((f) =>
          f.dataUrl.startsWith("data:image/")
            ? { type: "image_url", image_url: { url: f.dataUrl } }
            : { type: "file", file: { filename: f.name, file_data: f.dataUrl } },
        ),
      ]
    : prompt;
  const apiKey = process.env["OPENROUTER_API_KEY"];
  if (!apiKey) throw new GatewayError(401, "ИИ не настроен");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
    }),
  }).catch(() => null);

  if (!res) throw new GatewayError(500, "ИИ временно недоступен");
  if (res.status === 401) throw new GatewayError(401, "Ключ OpenRouter недействителен. Проверьте ключ в настройках.");
  if (res.status === 402) throw new GatewayError(402, "Закончились средства на счёте OpenRouter. Пополните баланс.");
  if (res.status === 429) throw new GatewayError(429, "Слишком много запросов. Попробуйте через минуту.");
  if (!res.ok) throw new GatewayError(res.status, "ИИ временно недоступен");

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new GatewayError(500, "ИИ не вернул ответ");
  return text;
}
