import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Правило стиля выведено из имеющихся обложек (переработка пластика, лист-сердце, стеклянный глобус).
const COVER_STYLE = `Создай обложку для школьной викторины. Строго соблюдай стиль:
- Фотореализм, как качественное стоковое фото; не иллюстрация, не 3D-мультяшность, не коллаж.
- Один понятный центральный предмет-символ темы, крупным планом, занимает 40–60% кадра, расположен по центру или чуть левее.
- Малая глубина резкости: предмет резкий, фон мягко размыт (боке), без отвлекающих деталей.
- Мягкий естественный дневной свет, светлая, чистая, «воздушная» атмосфера, лёгкие блики.
- Ограниченная гармоничная палитра из 1–2 доминирующих цветов, связанных с темой (например, зелень для природы, голубой и белый для воды/пластика).
- Горизонтальный кадр примерно 6:5, важные детали не у краёв (обложку обрезают).
- Позитивный, дружелюбный тон, подходящий для детей.
- Никакого текста, букв, цифр, логотипов, водяных знаков; людей — только руки, если нужно.`;

export type ImageResult = { ok: true; dataUrl: string } | { ok: false; error: string };

export const generateQuestionImage = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ prompt: z.string().trim().min(3).max(1500), kind: z.enum(["question", "cover"]).optional() }).parse(data))
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
            content: data.kind === "cover" ? `${COVER_STYLE}\n\nТема викторины:\n${data.prompt}` : `Сгенерируй иллюстрацию для школьной викторины, без текста на изображении: ${data.prompt}`,
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
