// Builds the QueryClient and the IndexedDB persister (SPEC.md §5.8 "Reads":
// persistQueryClient saves query results to IndexedDB, kept 7 days). The
// persister's storage is a `cache` table in offline/db.ts's Dexie database,
// so the app has one IndexedDB database, not one per library.
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";
import { db } from "./db";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: SEVEN_DAYS_MS, // must be >= persistOptions.maxAge below
      refetchOnWindowFocus: false, // this is a phone app, not a browser tab
    },
  },
});

const storage = {
  getItem: (key: string) => db.cache.get(key).then((row) => row?.value ?? null),
  setItem: (key: string, value: string) => db.cache.put({ key, value }).then(() => {}),
  removeItem: (key: string) => db.cache.delete(key),
};

export const persister: Persister = createAsyncStoragePersister({ storage });

export const persistOptions = {
  persister,
  maxAge: SEVEN_DAYS_MS,
  // Bump when a cached query's shape changes, so old shapes are discarded
  // instead of crashing a component that reads the new shape.
  buster: "1",
};
