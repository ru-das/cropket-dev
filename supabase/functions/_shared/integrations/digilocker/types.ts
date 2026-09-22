// Shared between index.ts, mock.ts and real.ts - same reason as
// integrations/ors/types.ts: mock/real don't need to import index.ts
// (which imports both of them) just to get this one type.
export type KycCheckInput = { businessName: string; gstNumber: string; pan: string };
