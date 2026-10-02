import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const SUBJECTS = [
  "Русский язык",
  "Литература",
  "Математика",
  "История",
  "Обществознание",
  "География",
  "Биология",
  "Физика",
  "Химия",
  "Информатика",
  "Английский язык",
  "Окружающий мир",
  "ИЗО",
] as const;

const QuestionSchema = z.object({
  text: z.string().min(1),
  correct: z.string().min(1),
  incorrect: z.array(z.string().min(1)).min(1).max(5),
});

const QuizSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

export type GeneratedQuiz = z.infer<typeof QuizSchema>;

export type GenerateResult = { ok: true; quiz: GeneratedQuiz } | { ok: false; error: string };

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        text: z.string().min(200).max(20000),
        count: z.number().int().min(1).max(20),
        subject: z.string().max(60).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<GenerateResult> => {
    const { generateText, GatewayError } = await import("./ai-gateway.server");
    const system =
      "Ты помощник учителя. Составляешь викторины для школьников строго по присланному тексту. " +
      "Отвечай только JSON без пояснений и markdown в формате: " +
      '{"title": string, "questions": [{"text": string, "correct": string, "incorrect": [string, string, string]}]}. ' +
      "Название до 60 символов, вопрос до 100 символов, варианты короткие. Ровно 3 неправильных варианта. Язык — русский.";
    const prompt =
      `Количество вопросов: ${data.count}.` +
      (data.subject ? ` Предмет: ${data.subject}.` : "") +
      `\n\nТекст:\n${data.text}`;
    try {
      const raw = await generateText(system, prompt);
      const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      const parsed = QuizSchema.safeParse(JSON.parse(json));
      if (!parsed.success) return { ok: false, error: "Не удалось разобрать ответ ИИ" };
      return { ok: true, quiz: { ...parsed.data, questions: parsed.data.questions.slice(0, data.count) } };
    } catch (e) {
      if (e instanceof GatewayError) return { ok: false, error: e.message };
      return { ok: false, error: "Не удалось сгенерировать викторину" };
    }
  });
