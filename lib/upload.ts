/**
 * Загрузка файлов: локальный диск (UPLOAD_DIR) или Vercel Blob (BLOB_READ_WRITE_TOKEN).
 * На localhost/VPS используйте UPLOAD_DIR; на Vercel при необходимости — Blob.
 */

import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { getBaseUrl } from "@/lib/config";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];

/** Абсолютная папка загрузок. На VPS задайте UPLOAD_DIR в .env (например /var/www/uploads). */
export function getUploadDir(): string {
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  return path.resolve(dir);
}

function isAllowedFile(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ALLOWED_MIME.includes(file.type)) return true;
  if (!file.type && ALLOWED_EXTENSIONS.includes(ext)) return true;
  return false;
}

/** Относительный путь для хранения в БД и раздачи через /api/uploads/... */
function uploadPathToUrl(relativePath: string): string {
  const base = getBaseUrl();
  return base ? `${base}/api/uploads/${relativePath}` : `/api/uploads/${relativePath}`;
}

export async function uploadFile(
  file: File,
  folder: string,
  userId: string
): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("Файл слишком большой. Максимальный размер 10MB");
  }
  if (!isAllowedFile(file)) {
    throw new Error("Разрешены только JPG, PNG и PDF файлы");
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const relativePath = `${folder}/${userId}/${uuidv4()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(relativePath, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const uploadDir = getUploadDir();
  const fullPath = path.join(uploadDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buffer);
  return uploadPathToUrl(relativePath);
}

const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AVATAR_MIME = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const AVATAR_EXT = ["jpg", "jpeg", "png", "webp"];

// Сигнатуры файлов (magic bytes), чтобы не полагаться только на MIME от клиента
const JPEG_SIG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_SIG = Buffer.from("RIFF", "ascii"); // WebP: RIFF....WEBP

function bufferStartsWith(buf: Buffer, sig: Buffer): boolean {
  return buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig);
}

function isAllowedAvatar(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (AVATAR_MIME.includes(file.type)) return true;
  if (!file.type && AVATAR_EXT.includes(ext)) return true;
  return false;
}

/** Проверка, что буфер — допустимое изображение по magic bytes. */
function isImageBuffer(buf: Buffer, ext: string): boolean {
  if (buf.length < 12) return false;
  if (ext === "jpg" || ext === "jpeg") return bufferStartsWith(buf, JPEG_SIG);
  if (ext === "png") return bufferStartsWith(buf, PNG_SIG);
  if (ext === "webp") return bufferStartsWith(buf, WEBP_SIG) && buf.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

/** Загрузка аватара пользователя (только изображения, до 2MB) */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  if (file.size > AVATAR_MAX_SIZE) {
    throw new Error("Файл слишком большой. Максимум 2MB");
  }
  if (!isAllowedAvatar(file)) {
    throw new Error("Разрешены только JPG, PNG и WebP");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isImageBuffer(buffer, ext)) {
    throw new Error("Содержимое файла не соответствует заявленному формату изображения");
  }

  const relativePath = `avatars/${userId}/${uuidv4()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(relativePath, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const uploadDir = getUploadDir();
  const fullPath = path.join(uploadDir, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer);
  return uploadPathToUrl(relativePath);
}

/** Российский паспорт: серия (4 цифры) + номер (6 цифр), с пробелами или без */
export function validatePassportNumber(passport: string): boolean {
  const normalized = passport.replace(/\s/g, "");
  const regex = /^\d{4}\s?\d{6}$/;
  return regex.test(normalized);
}

/** ИНН: 10 или 12 цифр */
export function validateINN(inn: string): boolean {
  if (!inn || !inn.trim()) return true; // опционально
  const regex = /^\d{10}$|^\d{12}$/;
  return regex.test(inn.replace(/\s/g, ""));
}

/** Из сохранённого URL/пути достаёт относительный путь (passports/..., selfies/...) или null если это не локальный файл (Blob). */
export function getRelativePathFromStored(stored: string): string | null {
  if (!stored?.trim()) return null;
  const match = stored.includes("/api/uploads/")
    ? stored.split("/api/uploads/")[1]?.split("?")[0]?.trim()
    : null;
  return match && !match.includes("..") ? match : null;
}

/** Удаляет файл с диска, если это локальный путь (не Blob). Возвращает true если файл удалён или не наш, false при ошибке. */
export async function deleteLocalFileIfExists(storedUrlOrPath: string): Promise<boolean> {
  const relative = getRelativePathFromStored(storedUrlOrPath);
  if (!relative) return true;
  const fullPath = path.join(getUploadDir(), relative);
  try {
    await fs.unlink(fullPath);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return true;
    return false;
  }
}
