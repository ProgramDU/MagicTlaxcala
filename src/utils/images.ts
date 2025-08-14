// Utilidades para comprimir a DataURL y medir tamaño
export const MAX_DATAURL_BYTES = 300 * 1024; // 300 KB
export const MAX_SIDE = 1200;
export const JPEG_QUALITY = 0.8;

export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
}

export async function fileToCompressedDataURL(
  file: File,
  maxSide = MAX_SIDE,
  quality = JPEG_QUALITY
): Promise<string> {
  const bmp = await createImageBitmap(file);
  const ratio = Math.min(maxSide / bmp.width, maxSide / bmp.height, 1);
  const w = Math.round(bmp.width * ratio);
  const h = Math.round(bmp.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", quality);
}
