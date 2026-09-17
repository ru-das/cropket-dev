// cropPhotoPath (SPEC.md §5.1, §7.4) - the only part of services/photos.ts
// that's pure. Its shape is exactly what supabase/tests/rls_crop_photos.sql
// checks: the first path segment must be the uploader's own uid.
import { describe, expect, it } from "vitest";
import { cropPhotoPath } from "@/services/photos";

describe("cropPhotoPath", () => {
  it("puts the file under the user's own uid folder", () => {
    expect(cropPhotoPath("user-123", "blob-abc")).toBe("user-123/blob-abc.jpg");
  });

  it("keeps the uid as the first path segment for any blob id", () => {
    const path = cropPhotoPath("22222222-2222-2222-2222-222222222222", "b1");
    expect(path.split("/")[0]).toBe("22222222-2222-2222-2222-222222222222");
  });
});
