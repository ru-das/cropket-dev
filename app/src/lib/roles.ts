// Where each role lands after login (SPEC.md §3.1). Used by the login
// redirect and by RequireRole when a signed-in user hits the wrong branch.
import type { Role } from "@shared/schemas/profile.ts";

const HOME_BY_ROLE: Record<Role, string> = {
  farmer: "/farmer",
  buyer: "/buyer",
  fpo: "/fpo",
  admin: "/admin",
  nbfc: "/admin",
};

export function homeFor(role: Role): string {
  return HOME_BY_ROLE[role];
}
