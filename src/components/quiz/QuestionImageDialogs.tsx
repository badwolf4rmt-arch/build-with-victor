import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import leaf from "@/assets/quiz-leaf.jpg";
import recycle from "@/assets/quiz-recycle.jpg";
import globe from "@/assets/quiz-globe.jpg";
import { generateQuestionImage } from "@/lib/quiz-image.functions";
import type { QuestionImage } from "@/lib/quiz-store";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";

const MAX_BYTES = 150 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/tiff,image/heic,image/webp,image/gif";
const READY = [
  { src: leaf, name: "Природа" },
  { src: recycle, name: "Сортировка" },
  { src: globe, name: "Планета" },
];

type Source = { src: string; name: string; type: string };
type Tab = "upload" | "ai" | "ready";

const TABS: { id: Tab; label: string }[] = [
  { id: "upload", label: "Загрузить с устройства" },
  { id: "ai", label: "Сгенерировать с ИИ" },
  { id: "ready", label: "Выбрать готовое" },
];

/** Full flow: pick a source (device / AI / ready-made) → crop → returns the cropped image. */
export function AddImageFlow({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: (img: QuestionImage) => void;
}) {
  const [source, setSource] = useState<Source | null>(null);

  const close = () => {
    setSource(null);
    onOpenChange(false);
  };

  return (
    <>
      <PickImageModal open={open && !source} onOpenChange={(o) => !o && close()} onPick={setSource} />
      {source && (
        <CropModal
          source={source}
          onBack={() => setSource(null)}
          onClose={close}
          onDone={(img) => {
            onDone(img);
            close();
          }}
        />
      )}
    </>
  );
}

function PickImageModal({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (s: Source) => void;
}) {
  const [tab, setTab] = useState<Tab>("upload");
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runAi = useServerFn(generateQuestionImage);

  function readFile(file?: File) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Нужен файл jpg, png, tiff, heic, webp или gif");
    if (file.size > MAX_BYTES) return setError("Файл больше 150 Мб");
    const reader = new FileReader();
    reader.onload = () =>
      onPick({ src: reader.result as string, name: file.name.replace(/\.[^.]+$/, ""), type: file.type });
    reader.readAsDataURL(file);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await runAi({ data: { prompt } });
      if (res.ok) onPick({ src: res.dataUrl, name: prompt.slice(0, 24), type: "image/png" });
      else setError(res.error);
    } catch {
      setError("Не удалось создать картинку");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !loading && onOpenChange(o)} title="Добавление изображения" className="max-w-[720px]">
      <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={cn(
              "h-10 rounded-lg text-sm font-semibold transition-colors",
              tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 h-[390px]">
        {tab === "upload" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              readFile(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-center transition-colors",
              drag ? "border-primary bg-info" : "border-border",
            )}
          >
            <p className="text-sm font-semibold">
              <button onClick={() => inputRef.current?.click()} className="text-primary hover:underline">
                Выберите изображение
              </button>{" "}
              или перетащите сюда
            </p>
            <p className="max-w-[300px] text-xs text-muted-foreground">
              Используйте изображение весом до 150 Мб в формате jpg, png, tiff, heic, webp или gif
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {tab === "ai" && (
          <div className="flex h-full flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
              placeholder="Опишите картинку, например: «Взятие Бастилии, рисунок в стиле гравюры»"
              className="flex-1 resize-none rounded-2xl border border-border p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              onClick={generate}
              disabled={loading || prompt.trim().length < 3}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
              {loading ? "ИИ рисует картинку…" : "Сгенерировать"}
            </button>
          </div>
        )}

        {tab === "ready" && (
          <div className="grid h-full grid-cols-3 content-start gap-3 overflow-y-auto">
            {READY.map((r) => (
              <button
                key={r.src}
                onClick={() => onPick({ src: r.src, name: r.name, type: "image/jpeg" })}
                className="aspect-[4/3] overflow-hidden rounded-xl ring-primary transition hover:ring-2"
              >
                <img src={r.src} alt={r.name} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </Modal>
  );
}

function CropModal({
  source,
  onBack,
  onClose,
  onDone,
}: {
  source: Source;
  onBack: () => void;
  onClose: () => void;
  onDone: (img: QuestionImage) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  async function add() {
    if (!area) return;
    setBusy(true);
    try {
      const src = await cropToDataUrl(source.src, area);
      const size = Math.round(((src.length - src.indexOf(",") - 1) * 3) / 4);
      onDone({ src, name: source.name || "изображение", type: "JPG", size });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Обрезать изображение"
      description="Выберите область, которая будет показана в вопросе"
      className="max-w-[624px]"
    >
      <div className="relative mt-6 h-[363px] overflow-hidden rounded-2xl bg-foreground">
        <Cropper
          image={source.src}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.05}
        value={zoom}
        onChange={(e) => setZoom(Number(e.target.value))}
        aria-label="Масштаб"
        className="mt-4 w-full accent-primary"
      />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={onBack} className="h-12 rounded-xl bg-secondary text-sm font-semibold hover:bg-muted">
          Выбрать другое изображение
        </button>
        <button
          onClick={add}
          disabled={busy || !area}
          className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Добавить
        </button>
      </div>
    </Modal>
  );
}

export function ReplaceImageModal({
  image,
  open,
  onOpenChange,
  onReplace,
}: {
  image?: QuestionImage;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onReplace: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Заменить изображение?" className="max-w-[506px]">
      {image && <img src={image.src} alt="" className="mt-6 h-[240px] w-full rounded-2xl object-cover" />}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => onOpenChange(false)} className="h-12 rounded-xl bg-secondary text-sm font-semibold hover:bg-muted">
          Отменить
        </button>
        <button
          onClick={onReplace}
          className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Заменить
        </button>
      </div>
    </Modal>
  );
}

async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const maxW = 1200;
  const scale = Math.min(1, maxW / area.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  canvas.getContext("2d")!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} Мб` : `${Math.max(1, Math.round(bytes / 1024))} Кб`;
}
