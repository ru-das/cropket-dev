// Reads/writes the caller's own `profiles` row (CLAUDE.md §3 "data access
// from the app goes through services/*"). RLS (supabase/migrations/*_profiles.sql)
// already stops anyone from touching another user's row or picking admin.
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toAppError, AppError } from "@/lib/errors";
import { type ProfileInput } from "@shared/schemas/profile.ts";
import { toPointWKT } from "@shared/geo.ts";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Returns the signed-in user's profile, or null if they haven't picked a role yet. */
export async function getMyProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw toAppError(error);
  return data;
}

export const profileKeys = {
  mine: () => ["profile", "mine"] as const,
};

/**
 * The signed-in user's profile, persisted to IndexedDB (offline/persist.ts)
 * so a farmer's home screen still renders with no internet (SPEC.md §5.8).
 * Only enabled once there is a session - app/providers.tsx passes that in.
 */
export function useMyProfile(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.mine(),
    queryFn: getMyProfile,
    enabled,
  });
}

export async function createMyProfile(input: ProfileInput): Promise<Profile> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new AppError("NOT_SIGNED_IN");

  // district/state are left out on purpose - the DB defaults them to the
  // pilot area (Nashik, Maharashtra) until reverse geocoding exists.
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: auth.user.id,
      name: input.name,
      role: input.role,
      village: input.village,
      crops: input.crops,
      location: input.location ? toPointWKT(input.location) : null,
    })
    .select("*")
    .single();
  if (error) throw toAppError(error);
  return data;
}
