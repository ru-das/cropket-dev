// Shared between index.ts, mock.ts and real.ts - kept in its own file so
// mock/real don't have to import index.ts (which imports both of them) just
// to get this one type.
import type { Crop } from "../../domain/crops.ts";

export type GradeCropInput = { crop: Crop; imageUrls: string[] };
