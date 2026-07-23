/**
 * Server-side Supabase Storage access for the Document Vault.
 *
 * Uses the service-role key, so this module must never be imported into client
 * code. When storage isn't configured (no URL / service-role key), calls throw
 * a StorageError the caller can surface gracefully. The private "documents"
 * bucket is created on demand.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";

export class StorageError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "UPLOAD_FAILED" | "URL_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

const BUCKET = env.SUPABASE_STORAGE_BUCKET;

let cached: SupabaseClient | null | undefined;
let bucketReady = false;

function getClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    cached = null;
    return null;
  }
  cached = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isStorageConfigured(): boolean {
  return getClient() !== null;
}

async function ensureBucket(client: SupabaseClient): Promise<void> {
  if (bucketReady) return;
  const { data } = await client.storage.getBucket(BUCKET);
  if (!data) {
    await client.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: "12mb",
      allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    });
  }
  bucketReady = true;
}

export async function uploadObject(params: {
  key: string;
  bytes: Buffer;
  contentType: string;
}): Promise<void> {
  const client = getClient();
  if (!client) throw new StorageError("NOT_CONFIGURED", "File storage is not configured.");
  await ensureBucket(client);

  const { error } = await client.storage
    .from(BUCKET)
    .upload(params.key, params.bytes, { contentType: params.contentType, upsert: false });
  if (error) throw new StorageError("UPLOAD_FAILED", error.message);
}

/** Create a short-lived signed URL for a private object. */
export async function createSignedUrl(key: string, expiresInSeconds = 120): Promise<string> {
  const client = getClient();
  if (!client) throw new StorageError("NOT_CONFIGURED", "File storage is not configured.");

  const { data, error } = await client.storage.from(BUCKET).createSignedUrl(key, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new StorageError("URL_FAILED", error?.message ?? "Could not create download link.");
  }
  return data.signedUrl;
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client.storage.from(BUCKET).remove([key]);
}
