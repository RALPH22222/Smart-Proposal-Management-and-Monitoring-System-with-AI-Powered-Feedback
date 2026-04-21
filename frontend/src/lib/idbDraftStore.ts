// Native IndexedDB wrapper for the proposal-submission draft.
// One DB, one store, one record per composite key. Fails closed everywhere —
// any error is caught and the caller sees null (reads) or void (writes),
// never a throw. Matches the silent-degradation behavior of the previous
// localStorage hook.

const DB_NAME = "pms_drafts";
const DB_VERSION = 1;
const STORE = "proposal_submission";

export type StoredFile = { blob: Blob; name: string; type: string };

export type DraftRecord<T> = {
  id: string;
  payload: T;
  files: { proposal: StoredFile | null; workPlan: StoredFile | null };
  updatedAt: number;
  schemaVersion: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;
let warned = false;

function warnOnce(msg: string, err?: unknown) {
  if (warned) return;
  warned = true;
  console.warn(`[idbDraftStore] ${msg}`, err);
}

export function openDraftDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("IDB open failed"));
      req.onblocked = () => reject(new Error("IDB open blocked"));
    } catch (e) {
      reject(e);
    }
  });
  dbPromise.catch((err) => {
    warnOnce("failed to open IndexedDB — autosave will be disabled", err);
    dbPromise = null;
  });
  return dbPromise;
}

async function withStore<R>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<R> | R,
): Promise<R | null> {
  let db: IDBDatabase;
  try {
    db = await openDraftDB();
  } catch {
    return null;
  }
  return new Promise<R | null>((resolve) => {
    try {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let out: R | null = null;
      Promise.resolve(fn(store))
        .then((v) => {
          out = v as R;
        })
        .catch((err) => {
          warnOnce("transaction callback threw", err);
        });
      tx.oncomplete = () => resolve(out);
      tx.onerror = () => {
        warnOnce("transaction error", tx.error);
        resolve(null);
      };
      tx.onabort = () => {
        warnOnce("transaction aborted", tx.error);
        resolve(null);
      };
    } catch (err) {
      warnOnce("failed to start transaction", err);
      resolve(null);
    }
  });
}

export async function readDraft<T>(
  id: string,
  opts: { schemaVersion: number; ttlMs: number },
): Promise<DraftRecord<T> | null> {
  const record = await withStore<DraftRecord<T> | null>("readonly", (store) =>
    new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as DraftRecord<T>) ?? null);
      req.onerror = () => resolve(null);
    }),
  );
  if (!record) return null;

  const isValid =
    record &&
    typeof record === "object" &&
    typeof (record as any).updatedAt === "number" &&
    typeof (record as any).schemaVersion === "number" &&
    "files" in record &&
    "payload" in record;

  if (!isValid) {
    await deleteDraft(id);
    return null;
  }

  if (record.schemaVersion !== opts.schemaVersion) {
    await deleteDraft(id);
    return null;
  }
  if (Date.now() - record.updatedAt > opts.ttlMs) {
    await deleteDraft(id);
    return null;
  }
  return record;
}

export async function writeDraft<T>(id: string, record: DraftRecord<T>): Promise<void> {
  await withStore<void>("readwrite", (store) =>
    new Promise((resolve) => {
      try {
        const req = store.put({ ...record, id });
        req.onsuccess = () => resolve();
        req.onerror = () => {
          warnOnce("write failed", req.error);
          resolve();
        };
      } catch (err) {
        warnOnce("write threw", err);
        resolve();
      }
    }),
  );
}

export async function deleteDraft(id: string): Promise<void> {
  await withStore<void>("readwrite", (store) =>
    new Promise((resolve) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    }),
  );
}
