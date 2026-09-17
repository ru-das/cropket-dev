// Shared between index.ts, mock.ts and real.ts - same reason as
// integrations/ai/types.ts and integrations/agmarknet/types.ts: mock/real
// don't need to import index.ts (which imports both of them) just to get
// this one type.
import type { LatLng } from "../../domain/geo.ts";

export type RouteDistanceInput = { from: LatLng; to: LatLng[] };
