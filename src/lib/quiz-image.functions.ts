import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; error: string };

export const generateQuestionImage = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ prompt: z.string().trim().min(3).max(500) }).parse(data))
  .handler(async ({ data }): Promise<ImageResult> => {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) return { ok: false, error: "ИИ не настроен" };
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Сгенерируй иллюстрацию для школьной викторины, без текста на изображении: ${data.prompt}`,
          },
        ],
      }),
    }).catch(() => null);
    if (!res) return { ok: false, error: "ИИ временно недоступен" };
    if (res.status === 401) return { ok: false, error: "Ключ OpenRouter недействителен. Проверьте ключ в настройках." };
    if (res.status === 402) return { ok: false, error: "Закончились средства на счёте OpenRouter. Пополните баланс." };
    if (res.status === 429) return { ok: false, error: "Слишком много запросов. Попробуйте через минуту." };
    if (res.status === 400) return { ok: false, error: "Не удалось создать картинку по этому описанию" };
    if (!res.ok) return { ok: false, error: "ИИ временно недоступен" };
    const json = (await res.json()) as {
      choices?: { message?: { images?: { image_url?: { url?: string } }[] } }[];
    };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) return { ok: false, error: "ИИ не вернул картинку" };
    return { ok: true, dataUrl: url };
  });
