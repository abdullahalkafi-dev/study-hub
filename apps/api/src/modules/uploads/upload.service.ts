import crypto from "node:crypto";
import type { Readable } from "node:stream";
import { Client } from "minio";
import { env } from "../../config/env.ts";
import { HttpError } from "../../middleware/error.ts";
import { Upload } from "./upload.model.ts";

export const ALLOWED = /^(image|audio|video)\//;
export const MAX_BYTES = 50 * 1024 * 1024;

let client: Client | null = null;
let bucketReady = false;
export const storageConfigured = () => !!(env.minio.accessKey && env.minio.secretKey);

function mc() {
  if (!storageConfigured()) throw new HttpError(503, "File storage is not configured (set MINIO_ACCESS_KEY and MINIO_SECRET_KEY in .env)");
  return (client ||= new Client({ endPoint: env.minio.endpoint, port: env.minio.port, useSSL: env.minio.useSSL, accessKey: env.minio.accessKey, secretKey: env.minio.secretKey }));
}
async function ensureBucket() {
  if (bucketReady) return;
  const c = mc();
  if (!(await c.bucketExists(env.minio.bucket))) await c.makeBucket(env.minio.bucket);
  bucketReady = true;
}
const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").slice(-120) || "file";

export async function add(userId: string, week: number, day: number, f: { originalname: string; mimetype: string; buffer: Buffer; size: number }) {
  if (!ALLOWED.test(f.mimetype)) throw new HttpError(400, "Only image, audio and video files are allowed");
  await ensureBucket();
  const filename = safeName(f.originalname);
  const objectKey = `${userId}/${week}-${day}/${crypto.randomUUID()}-${filename}`;
  await mc().putObject(env.minio.bucket, objectKey, f.buffer, f.size, { "Content-Type": f.mimetype });
  const doc: any = await Upload.create({ userId, week, day, objectKey, filename, mime: f.mimetype, size: f.size });
  return doc.toObject();
}
export const list = (userId: string, week: number, day: number) => Upload.find({ userId, week, day }).sort({ createdAt: 1 }).lean();
export async function open(userId: string, id: string): Promise<{ meta: any; stream: Readable }> {
  const meta: any = await Upload.findOne({ _id: id, userId }).lean();
  if (!meta) throw new HttpError(404, "File not found");
  return { meta, stream: await mc().getObject(env.minio.bucket, meta.objectKey) };
}
export async function remove(userId: string, id: string) {
  const meta: any = await Upload.findOne({ _id: id, userId });
  if (!meta) throw new HttpError(404, "File not found");
  await mc().removeObject(env.minio.bucket, meta.objectKey);
  await meta.deleteOne();
  return meta.toObject();
}
