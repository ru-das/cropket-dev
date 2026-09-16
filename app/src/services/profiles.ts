// Reads/writes the caller's own `profiles` row (CLAUDE.md §3 "data access
// from the app goes through services/*"). RLS (supabase/migrations/*_profiles.sql)
// already stops anyone from touching another user's row or picking admin.
import { supabase } from "@/lib/supabase";
import { toAppError, AppError } from "@/lib/errors";
import { type ProfileInput } from "@shared/schemas/profile.ts";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Returns the signed-in user's profile, or null if they haven't picked a role yet. */
export async function getMyProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw toAppError(error);
  return data;
}

export async function createMyProfile(input: ProfileInput): Promise<Profile> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AppError("NOT_SIGNED_IN");

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: auth.user.id, name: input.name, role: input.role })
    .select("*")
    .single();
  if (error) throw toAppError(error);
  return data;
}
