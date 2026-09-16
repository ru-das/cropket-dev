// The one Dexie (IndexedDB) database on the phone (SPEC.md §5.8). Used by
// offline/persist.ts (query cache) today; 0.6b adds drafts/blobs/outbox for
// offline writes. Nothing outside offline/* should import this directly.
import Dexie, { type EntityTable } from "dexie";

type CacheRow = { key: string; value: string };

export const db = new Dexie("cropket") as Dexie & {
  cache: EntityTable<CacheRow, "key">;
};

db.version(1).stores({
  cache: "key",
});

// Asks the browser not to evict this database under storage pressure
// (SPEC.md §5.8 rule 5). Best-effort: some browsers don't support it, and a
// "no" here doesn't mean data loss is certain, so nothing else waits on it.
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  void navigator.storage.persist();
}
