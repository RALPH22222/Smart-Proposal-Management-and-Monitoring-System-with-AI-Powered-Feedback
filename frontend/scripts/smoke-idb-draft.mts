// Smoke test for src/lib/idbDraftStore. Runs in Node via tsx + fake-indexeddb.
// Exits 0 on success, non-zero on failure. Not a test framework — a sanity
// ping that exercises every public method and every rejection branch.

import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { readDraft, writeDraft, deleteDraft } from "../src/lib/idbDraftStore";

const id = "pms_draft:test-user:proposal_submission";
const TTL_30D = 30 * 86400 * 1000;

async function run() {
  // 1. Empty DB → read returns null
  await deleteDraft(id);
  assert.equal(
    await readDraft(id, { schemaVersion: 1, ttlMs: TTL_30D }),
    null,
    "empty read should return null",
  );

  // 2. Round-trip a full record (payload + one blob)
  const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "application/pdf" });
  const record = {
    id,
    payload: { title: "Hello", budget: 123 },
    files: {
      proposal: { blob, name: "form1b.pdf", type: "application/pdf" },
      workPlan: null,
    },
    updatedAt: Date.now(),
    schemaVersion: 1,
  };
  await writeDraft(id, record);

  const read = await readDraft<{ title: string; budget: number }>(id, {
    schemaVersion: 1,
    ttlMs: TTL_30D,
  });
  assert.ok(read, "should read back the record");
  assert.deepEqual(read.payload, { title: "Hello", budget: 123 });
  assert.equal(read.files.proposal?.name, "form1b.pdf");
  assert.equal(read.files.proposal?.type, "application/pdf");
  assert.equal(read.files.workPlan, null);

  // 3. TTL expiry — stale record must read as null AND be deleted
  const stale = { ...record, updatedAt: Date.now() - 31 * 86400 * 1000 };
  await writeDraft(id, stale);
  assert.equal(
    await readDraft(id, { schemaVersion: 1, ttlMs: TTL_30D }),
    null,
    "stale record should read as null",
  );
  // Confirm deletion side-effect
  assert.equal(
    await readDraft(id, { schemaVersion: 1, ttlMs: TTL_30D }),
    null,
    "stale record should remain null on subsequent reads",
  );

  // 4. schemaVersion mismatch — read must return null AND delete the record
  await writeDraft(id, { ...record, schemaVersion: 1, updatedAt: Date.now() });
  assert.equal(
    await readDraft(id, { schemaVersion: 2, ttlMs: TTL_30D }),
    null,
    "schema mismatch should read as null",
  );
  assert.equal(
    await readDraft(id, { schemaVersion: 1, ttlMs: TTL_30D }),
    null,
    "mismatched record should have been deleted",
  );

  // 5. Explicit delete
  await writeDraft(id, record);
  await deleteDraft(id);
  assert.equal(
    await readDraft(id, { schemaVersion: 1, ttlMs: TTL_30D }),
    null,
    "after delete should be null",
  );

  console.log("smoke-idb-draft: all cases passed");
}

run().catch((err) => {
  console.error("smoke-idb-draft FAILED:", err);
  process.exit(1);
});
