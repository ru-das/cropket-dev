// The crops Cropket supports in the prototype (SPEC.md §2.3 crop rules
// table). Onboarding (1.1) uses this to validate the crops a farmer/FPO
// picks; lots (1.6) and the price screens (M2) will use the same list.
// Pure TypeScript + zod only (CLAUDE.md §4 "shared domain code").
import { z } from "zod";

export const Crop = z.enum(["onion", "tomato", "potato"]);
export type Crop = z.infer<typeof Crop>;

export const CROPS: Crop[] = ["onion", "tomato", "potato"];
