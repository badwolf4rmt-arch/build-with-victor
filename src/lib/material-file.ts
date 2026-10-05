/** Reads an uploaded lesson file: text formats are extracted in the browser, PDF/images are sent to the AI as files. */
export type Material = { text?: string; file?: { name: string; dataUrl: string } };

export const MATERIAL_ACCEPT = ".txt,.md,.docx,.pdf,.png,.jpg,.jpeg,.webp";
const MAX_MB = 10;

export async function readMaterialFile(f: File): Promise<Material> {
  if (f.size > MAX_MB * 1024 * 1024) throw new Error(`Файл больше ${MAX_MB} МБ`);
  const name = f.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) return { text: (await f.text()).slice(0, 30000) };
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
    if (!value.trim()) throw new Error("В файле не найден текст");
    return { text: value.slice(0, 30000) };
  }
  if (/\.(pdf|png|jpe?g|webp)$/.test(name)) {
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(new Error("Не удалось прочитать файл"));
      r.readAsDataURL(f);
    });
    return { file: { name: f.name, dataUrl } };
  }
  throw new Error("Поддерживаются PDF, DOCX, TXT и изображения");
}
