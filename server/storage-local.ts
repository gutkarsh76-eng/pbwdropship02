// Local file storage implementation for Zeabur
// Stores files in /tmp/uploads directory

import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const UPLOAD_DIR = "/tmp/uploads";
const PUBLIC_URL_PREFIX = "/api/files";

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  await ensureUploadDir();

  // Normalize the key
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOAD_DIR, key);

  // Create directory structure if needed
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Convert data to buffer if needed
  let buffer: Buffer;
  if (typeof data === "string") {
    buffer = Buffer.from(data);
  } else if (data instanceof Uint8Array) {
    buffer = Buffer.from(data);
  } else {
    buffer = data;
  }

  // Write file
  await fs.writeFile(filePath, buffer);

  // Return public URL
  const url = `${PUBLIC_URL_PREFIX}/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const url = `${PUBLIC_URL_PREFIX}/${key}`;
  return { key, url };
}

export async function storageDelete(relKey: string): Promise<void> {
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOAD_DIR, key);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
}

export async function getFileBuffer(relKey: string): Promise<Buffer> {
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOAD_DIR, key);
  return await fs.readFile(filePath);
}
