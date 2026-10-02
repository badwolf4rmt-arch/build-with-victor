import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; error: string };

export const generateQuestionImage = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ prompt: z.string().trim().min(3).max(500) }).parse(data))
  .handler(async ({ data }): Promise<ImageResult> => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) return { ok: false, error: "ИИ не настроен" };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2.5-sunburst",
        prompt: `Иллюстрация для школьной викторины, без текста: ${data.prompt}`,
        size: "1536x1024",
        quality: "low",
      }),
    }).catch(() => null);
    if (!res) return { ok: false, error: "ИИ временно недоступен" };
    if (res.status === 402) return { ok: false, error: "Закончились кредиты ИИ. Пополните баланс в настройках." };
    if (res.status === 429) return { ok: false, error: "Слишком много запросов. Попробуйте через минуту." };
    if (res.status === 400) return { ok: false, error: "Не удалось создать картинку по этому описанию" };
    if (!res.ok) return { ok: false, error: "ИИ временно недоступен" };
    const json = (await res.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return { ok: false, error: "ИИ не вернул картинку" };
    return { ok: true, dataUrl: `data:image/png;base64,${b64}` };
  });
