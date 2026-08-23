import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Two servers-side clients, two levels of trust:
 *
 * - `supabaseRead`  — the public (publishable) key. Can only do what Row Level
 *   Security allows anonymous visitors to do: read. Used for standings, rosters.
 * - `supabaseAdmin` — the secret service-role key, which BYPASSES Row Level
 *   Security. It exists only on the server (never shipped to the browser) and
 *   is what the coach's write actions (generate round, submit score) run with.
 *
 * This file imports "server-only", so Next.js refuses to bundle it into any
 * client component — a compile-time guarantee the secret stays server-side.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const supabaseRead = createClient<Database>(
  url,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);

export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.startsWith("paste-")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Copy .env.local.example to .env.local " +
        "and paste your service-role key (Supabase dashboard → Project Settings → API keys).",
    );
  }
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
