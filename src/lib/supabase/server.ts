import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Two server-side clients, two levels of trust:
 *
 * - supabaseRead()  — the public (publishable) key. Can only do what Row Level
 *   Security allows anonymous visitors to do: read. Used for standings, rosters.
 * - supabaseAdmin() — the secret service-role key, which BYPASSES Row Level
 *   Security. It exists only on the server (never shipped to the browser) and
 *   is what the coach's write actions (generate round, submit score) run with.
 *
 * This file imports "server-only", so Next.js refuses to bundle it into any
 * client component — a compile-time guarantee the secret stays server-side.
 *
 * Both clients are built lazily, on the first request that needs one. That
 * laziness is load-bearing for deployment: building a client at module scope
 * runs during `next build`, so a missing variable fails the build with
 * supabase-js's opaque "supabaseUrl is required" instead of naming what to fix.
 * Deferring it means the app builds and deploys with no configuration, and an
 * unset variable surfaces at request time as the message below.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.startsWith("paste-")) {
    throw new Error(
      `${name} is not set. Locally: copy .env.local.example to .env.local and fill it in. ` +
        `On Vercel: Project Settings → Environment Variables, then redeploy. ` +
        `The Supabase values live in your Supabase dashboard under Project Settings → API keys.`,
    );
  }
  return value;
}

let readClient: ReturnType<typeof createClient<Database>> | null = null;

/** Public-key client: can only do what Row Level Security allows anyone to do (read). */
export function supabaseRead() {
  readClient ??= createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false } },
  );
  return readClient;
}

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/** Secret-key client: bypasses Row Level Security. Server-side writes only. */
export function supabaseAdmin() {
  adminClient ??= createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
  return adminClient;
}
