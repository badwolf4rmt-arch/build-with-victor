/** Downscales an image data URL to a compact JPEG so it fits in browser storage (AI images arrive as multi-MB PNGs). */
export async function compressImage(src: string, maxW = 960, quality = 0.82): Promise<string> {
  if (typeof document === "undefined" || !src.startsWith("data:")) return src;
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const scale = Math.min(1, maxW / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL("image/jpeg", quality);
    return out.length < src.length ? out : src;
  } catch {
    return src;
  }
}
