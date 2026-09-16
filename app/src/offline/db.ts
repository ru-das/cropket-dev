// The one Dexie (IndexedDB) database on the phone (SPEC.md §5.8): the query
// cache (offline/persist.ts) plus the offline-write tables (offline/outbox.ts,
// offline/sync.ts). `tripQueue` from SPEC.md §5.8 isn't created yet - it's
// only needed by the driver page, milestone 4.7. Nothing outside offline/*
// should import this directly.
import Dexie, { type EntityTable } from "dexie";
import type { OutboxItem } from "./outbox";

type CacheRow = { key: string; value: string };

// A saved-but-not-yet-uploaded lot or grade request (SPEC.md §5.8).
type Draft = { id: string; kind: "lot" | "grade"; payload: unknown; createdAt: number };

// A photo or audio clip belonging to a draft. `uploadedPath` is filled in
// once the matching `upload_blob` outbox item succeeds.
type Blob_ = {
  id: string;
  draftId: string;
  kind: "photo" | "audio";
  data: Blob;
  uploadedPath?: string;
};

export const db = new Dexie("cropket") as Dexie & {
  cache: EntityTable<CacheRow, "key">;
  drafts: EntityTable<Draft, "id">;
  blobs: EntityTable<Blob_, "id">;
  outbox: EntityTable<OutboxItem, "id">;
};

db.version(1).stores({
  cache: "key",
});

db.version(2).stores({
  drafts: "id, kind, createdAt",
  blobs: "id, draftId, kind",
  outbox: "id, status, nextTryAt, createdAt",
});

// Asks the browser not to evict this database under storage pressure
// (SPEC.md §5.8 rule 5). Best-effort: some browsers don't support it, and a
// "no" here doesn't mean data loss is certain, so nothing else waits on it.
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  void navigator.storage.persist();
}
