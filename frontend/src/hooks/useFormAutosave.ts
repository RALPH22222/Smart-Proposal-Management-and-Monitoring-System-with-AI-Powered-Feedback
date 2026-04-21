import { useCallback, useEffect, useRef, useState } from "react";
import {
  readDraft,
  writeDraft,
  deleteDraft,
  type StoredFile,
} from "../lib/idbDraftStore";

// Proposal-submission draft autosave, backed by IndexedDB.
//
// Persists form state AND attached file blobs together in a single atomic
// record so a browser crash / power-off / accidental close can resume the
// full draft — including uploaded files — on the same device. Debounced
// 500 ms so the last half-second of typing is the worst-case loss.
//
// Public surface preserved from the previous localStorage version:
//   isHydrating, lastSavedAt, pendingDraft, acceptDraft, dismissDraft, clear
// The only shape change is additive: pendingDraft now includes a `files`
// field alongside `payload` and `updatedAt`.
//
// Fails closed if IndexedDB is unavailable (private-browsing lockouts,
// storage disabled, quota exhausted) — the form keeps working with no
// autosave, matching the previous silent-degradation behavior.

const DEBOUNCE_MS = 500;
const TTL_MS = 30 * 86400 * 1000; // 30 days

type SerializableValue = unknown;

export interface DraftFiles {
  proposal: File | null;
  workPlan: File | null;
}

interface UseFormAutosaveOptions<T extends SerializableValue> {
  storageKey: string;
  value: T;
  enabled?: boolean;
  files?: DraftFiles;
  schemaVersion: number;
}

interface PendingDraft<T> {
  payload: T;
  files: DraftFiles;
  updatedAt: number;
}

interface UseFormAutosaveResult<T extends SerializableValue> {
  isHydrating: boolean;
  lastSavedAt: number | null;
  pendingDraft: PendingDraft<T> | null;
  acceptDraft: () => void;
  dismissDraft: () => void;
  clear: () => void;
}

function storedToFile(s: StoredFile | null): File | null {
  if (!s) return null;
  try {
    return new File([s.blob], s.name, { type: s.type });
  } catch {
    return null;
  }
}

function fileToStored(f: File | null): StoredFile | null {
  if (!f) return null;
  return { blob: f, name: f.name, type: f.type };
}

export function useFormAutosave<T extends SerializableValue>(
  options: UseFormAutosaveOptions<T>,
): UseFormAutosaveResult<T> {
  const { storageKey, value, enabled = true, files, schemaVersion } = options;

  const [isHydrating, setIsHydrating] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PendingDraft<T> | null>(null);

  const timer = useRef<number | null>(null);
  const hasHydrated = useRef(false);
  const quotaWarned = useRef(false);

  // Hydrate on mount: clear legacy localStorage draft, then read IDB.
  useEffect(() => {
    let cancelled = false;

    // One-time cleanup of the previous localStorage-backed draft format.
    // Users with an in-flight localStorage draft at rollout lose it once;
    // it never contained files anyway, so the degradation is minimal.
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }

    readDraft<T>(storageKey, { schemaVersion, ttlMs: TTL_MS }).then((record) => {
      if (cancelled) return;
      if (record) {
        setPendingDraft({
          payload: record.payload,
          files: {
            proposal: storedToFile(record.files?.proposal ?? null),
            workPlan: storedToFile(record.files?.workPlan ?? null),
          },
          updatedAt: record.updatedAt,
        });
      }
      setIsHydrating(false);
      hasHydrated.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey, schemaVersion]);

  // Debounced write: any change to form value OR either file.
  useEffect(() => {
    if (!enabled || !hasHydrated.current) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const proposal = fileToStored(files?.proposal ?? null);
        const workPlan = fileToStored(files?.workPlan ?? null);
        await writeDraft(storageKey, {
          id: storageKey,
          payload: value,
          files: { proposal, workPlan },
          updatedAt: Date.now(),
          schemaVersion,
        });
        setLastSavedAt(Date.now());
      } catch (err) {
        const isQuota =
          err instanceof DOMException && err.name === "QuotaExceededError";
        if (isQuota && !quotaWarned.current) {
          quotaWarned.current = true;
          console.warn(
            "[useFormAutosave] device storage is full — draft autosave disabled for this session",
            err,
          );
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, enabled, storageKey, schemaVersion, files?.proposal, files?.workPlan]);

  const acceptDraft = useCallback(() => {
    setPendingDraft(null);
  }, []);

  const dismissDraft = useCallback(() => {
    setPendingDraft(null);
    deleteDraft(storageKey);
  }, [storageKey]);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    deleteDraft(storageKey);
    setLastSavedAt(null);
    setPendingDraft(null);
  }, [storageKey]);

  return {
    isHydrating,
    lastSavedAt,
    pendingDraft,
    acceptDraft,
    dismissDraft,
    clear,
  };
}
