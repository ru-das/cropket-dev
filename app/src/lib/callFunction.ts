// The one way services/* call an Edge Function (CLAUDE.md §3 "Pages never
// import lib/supabase.ts. Only services/* and offline/* do."). Every
// function answers { ok: true, data } or { ok: false, error: { code } }
// (CLAUDE.md §5) - this turns that into a thrown AppError so a service
// never has to unwrap the shape itself. First user: services/grading.ts.
import { supabase } from "@/lib/supabase";
import { AppError } from "@/lib/errors";

type FunctionReply<T> = { ok: true; data: T } | { ok: false; error: { code: string } };

/** Calls an Edge Function by name and returns its `data`, or throws an AppError. */
export async function callFunction<T>(name: string, body: unknown): Promise<T> {
  // The caller already validated `body` with a zod schema (CLAUDE.md §5.2
  // "Every input is validated with zod") - it's always a plain JSON object
  // by the time it gets here, just not typed as one, since callFunction
  // itself has no schema to check it against.
  const { data, error, response } = await supabase.functions.invoke<FunctionReply<T>>(name, {
    body: body as Record<string, unknown>,
  });

  if (error) {
    // supabase-js throws on any non-2xx even though the body is still our
    // own { ok: false, error: { code } } shape - the code has to be read
    // back out of the raw response it attaches, not out of `data`. No
    // `response` at all means the request never reached the server (offline,
    // DNS, CORS) - that's a real NETWORK_ERROR, not a server-sent code.
    if (!response) throw new AppError("NETWORK_ERROR");
    const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new AppError(body?.error?.code ?? "UNKNOWN");
  }
  if (!data || !data.ok) throw new AppError(data?.error.code ?? "UNKNOWN");
  return data.data;
}
