import { env } from "cloudflare:workers";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
} as const;
type Ext = keyof typeof TYPES;

/** Media keys look like posts/2026/<uuid>.png. Anything else is rejected. */
const KEY = /^posts\/\d{4}\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/;

/**
 * Identify the image from its first bytes rather than trusting the filename or the
 * browser-supplied type. SVG is deliberately unsupported: it can carry scripts.
 */
function sniff(b: Uint8Array): Ext | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length >= 8 && b[0] === 0x89 && ascii(1, 4) === "PNG" && b[4] === 0x0d && b[5] === 0x0a) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) return "gif";
  if (b.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export class UploadError extends Error {}

export async function saveImage(file: File) {
  if (file.size === 0) throw new UploadError("That file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Images must be 10 MB or smaller.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) throw new UploadError("Only PNG, JPEG, GIF and WebP images can be uploaded.");

  const key = `posts/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType: TYPES[ext] },
    customMetadata: { originalName: file.name.slice(0, 200) },
  });
  return `/media/${key}`;
}

export function isMediaKey(key: string) {
  return KEY.test(key);
}

export function getImage(key: string, request: Request) {
  return env.MEDIA.get(key, { onlyIf: request.headers });
}
