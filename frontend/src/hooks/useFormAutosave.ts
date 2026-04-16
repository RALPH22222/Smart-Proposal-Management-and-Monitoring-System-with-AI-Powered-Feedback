import { useCallback, useEffect, useRef, useState } from "react";

// Phase 1 of LIB feature: localStorage-only draft autosave.
//
// Keeps form state safe across power-off, browser crash, accidental tab close, and OS
// restart. The draft is debounced ~500ms so at worst the user loses the last half-second
// of typing. Server-side drafts were considered but dropped — the server copy added a
// whole workflow (new table, three Lambdas, stale-draft prompts referencing lookups that
// may have been deleted) for marginal benefit, since cross-device resume is almost never
// needed for this audience.
//
// Usage:
//
//   const autosave = useFormAutosave({
//     storageKey: `pms_draft:${userId}:proposal_submission`,
//     value: localFormData,
//     enabled: !isSubmitting,
//   });
//
//   // After successful submit:
//   autosave.clear();
//
// On mount, if localStorage has a payload, `pendingDraft` is set and the form can offer
// to resume. The caller decides what to do — accept (applies the payload) or dismiss
// (wipes it). Autosave starts ticking after the user resolves the prompt.

const DEBOUNCE_MS = 500;

type SerializableValue = unknown;

interface UseFormAutosaveOptions<T extends SerializableValue> {
  storageKey: string;
  value: T;
  enabled?: boolean;
}

interface UseFormAutosaveResult<T extends SerializableValue> {
  // True until the initial localStorage read has finished.
  isHydrating: boolean;
  // Most recent write timestamp (ms since epoch).
  lastSavedAt: number | null;
  // The draft we found on mount, if any. Null once accepted or dismissed.
  pendingDraft: { payload: T; updatedAt: number } | null;
  // User accepted the draft — the caller should apply the payload then call this.
  acceptDraft: () => void;
  // User dismissed the draft — wipes localStorage so we don't keep prompting.
  dismissDraft: () => void;
  // Called after a successful form submit — wipes the draft.
  clear: () => void;
}

function readLocal<T>(key: string): { payload: T; updatedAt: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return { payload: parsed.payload as T, updatedAt: Number(parsed.updatedAt) || Date.now() };
  } catch {
    return null;
  }
}

function writeLocal(key: string, payload: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ payload, updatedAt: Date.now() }));
  } catch {
    // localStorage may be full or disabled — fail silently. Nothing else to fall back to.
  }
}

function clearLocal(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function useFormAutosave<T extends SerializableValue>(
  options: UseFormAutosaveOptions<T>,
): UseFormAutosaveResult<T> {
  const { storageKey, value, enabled = true } = options;

  const [isHydrating, setIsHydrating] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [pendingDraft, setPendingDraft] = useState<UseFormAutosaveResult<T>["pendingDraft"]>(null);

  const timer = useRef<number | null>(null);
  const hasHydrated = useRef(false);

  // Read any existing draft on mount. Synchronous — no network call.
  useEffect(() => {
    const draft = readLocal<T>(storageKey);
    setPendingDraft(draft);
    setIsHydrating(false);
    hasHydrated.current = true;
  }, [storageKey]);

  // Whenever the form value changes (after hydration, while enabled), schedule a
  // debounced localStorage write. Resets on every keystroke so we don't thrash the API.
  useEffect(() => {
    if (!enabled || !hasHydrated.current) return;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      writeLocal(storageKey, value);
      setLastSavedAt(Date.now());
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, enabled, storageKey]);

  const acceptDraft = useCallback(() => {
    setPendingDraft(null);
  }, []);

  const dismissDraft = useCallback(() => {
    setPendingDraft(null);
    clearLocal(storageKey);
  }, [storageKey]);

  const clear = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    clearLocal(storageKey);
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
