// Phase 3 of LIB feature: proponent-side budget realignment form.
//
// Opens from the monitoring page "Request Realignment" button. Loads the project's active
// budget version, lets the proponent edit (modify amounts, remove items, add new items),
// enforces the grand total ceiling client-side, then POSTs to /project/realignment/request.
//
// The server is the source of truth for both the ceiling and the concurrency check — this UI
// is convenience, not security. After submission, the proponent's monitoring banner shows
// "Realignment under review" and the same form is locked until the decision lands.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  FileUp,
  Save,
  MessageSquareWarning,
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  fetchActiveBudgetVersion,
  requestBudgetRealignment,
  uploadReportFile,
  type BudgetItemDto,
  type RealignmentLineInput,
  type RealignmentRecord,
} from '../../services/ProjectMonitoringApi';

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const formatPHP = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n || 0);
// See budgetSection.tsx for rationale — hide browser spinner on price fields only.
const NO_SPINNER_CLASS =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const CATEGORY_LABEL: Record<'ps' | 'mooe' | 'co', string> = {
  ps: 'Personnel Services',
  mooe: 'Maintenance & Other Operating Expenses',
  co: 'Capital Outlay / Equipment',
};

interface EditableRow {
  uid: string;
  source: string;
  category: 'ps' | 'mooe' | 'co';
  subcategoryId: number | null;
  customSubcategoryLabel: string | null;
  itemName: string;
  spec: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  // Tracks if this row was added by the proponent during this realignment (vs being a
  // baseline item from the active version). Used purely for UI marker.
  isNew?: boolean;
}

function dtoToEditable(item: BudgetItemDto): EditableRow {
  return {
    uid: `row_${item.id ?? Math.random().toString(36).slice(2)}_${Date.now()}`,
    source: item.source ?? '',
    category: item.category,
    subcategoryId: item.subcategory_id ?? null,
    customSubcategoryLabel: item.custom_subcategory_label ?? null,
    itemName: item.item_name ?? '',
    spec: item.spec ?? '',
    quantity: Number(item.quantity) || 0,
    unit: item.unit ?? '',
    unitPrice: Number(item.unit_price) || 0,
    totalAmount: Number(item.total_amount) || 0,
  };
}

// Proposed-payload items (from a revision_requested realignment) come in camelCase from the
// Zod schema. Normalize them back to the editable-row shape so we can seed the form state.
function proposedToEditable(raw: any): EditableRow {
  return {
    uid: `revise_${Math.random().toString(36).slice(2)}_${Date.now()}`,
    source: raw.source ?? '',
    category: (raw.category ?? 'mooe') as 'ps' | 'mooe' | 'co',
    subcategoryId: raw.subcategoryId ?? null,
    customSubcategoryLabel: raw.customSubcategoryLabel ?? null,
    itemName: raw.itemName ?? '',
    spec: raw.spec ?? '',
    quantity: Number(raw.quantity) || 0,
    unit: raw.unit ?? '',
    unitPrice: Number(raw.unitPrice) || 0,
    totalAmount: Number(raw.totalAmount) || 0,
  };
}

interface RealignmentFormModalProps {
  fundedProjectId: number;
  // When set, the modal opens in revise mode: seeded from the existing realignment's
  // proposed_payload instead of the current active budget, with the review_note surfaced
  // at the top so the proponent can see what R&D asked for. Submission updates the
  // existing row in place (backend routes the UPDATE vs INSERT internally).
  existingRealignment?: RealignmentRecord | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const RealignmentFormModal: React.FC<RealignmentFormModalProps> = ({
  fundedProjectId,
  existingRealignment,
  onClose,
  onSubmitted,
}) => {
  const isReviseMode = !!existingRealignment && existingRealignment.status === 'revision_requested';
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [baselineTotal, setBaselineTotal] = useState(0);
  const [versionNumber, setVersionNumber] = useState<number | null>(null);
  const [rows, setRows] = useState<EditableRow[]>([]);

  const [reason, setReason] = useState(isReviseMode ? (existingRealignment?.reason ?? '') : '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Always fetch the active version for the ceiling check. In revise mode we additionally
  // seed the editable rows from the *existing realignment's* proposed_payload so the
  // proponent continues editing their previous attempt instead of starting over.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchActiveBudgetVersion(fundedProjectId)
      .then((res) => {
        if (cancelled) return;
        setBaselineTotal(Number(res.version.grand_total) || 0);
        setVersionNumber(res.version.version_number);

        if (isReviseMode && existingRealignment?.proposed_payload?.items?.length) {
          const proposed = existingRealignment.proposed_payload.items
            .map(proposedToEditable)
            .sort((a, b) => {
              if (a.category !== b.category) {
                return ['ps', 'mooe', 'co'].indexOf(a.category) - ['ps', 'mooe', 'co'].indexOf(b.category);
              }
              return 0;
            });
          setRows(proposed);
          return;
        }

        const items = (res.version.items ?? []).slice().sort((a, b) => {
          if (a.category !== b.category) {
            return ['ps', 'mooe', 'co'].indexOf(a.category) - ['ps', 'mooe', 'co'].indexOf(b.category);
          }
          return (a.display_order ?? 0) - (b.display_order ?? 0);
        });
        setRows(items.map(dtoToEditable));
      })
      .catch((err: any) => {
        if (cancelled) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load the current budget. Try again.';
        setLoadError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fundedProjectId, isReviseMode, existingRealignment]);

  const newTotal = useMemo(() => rows.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0), [rows]);
  const delta = newTotal - baselineTotal;
  const overCeiling = round2(newTotal) > round2(baselineTotal);
  const remainingHeadroom = baselineTotal - newTotal;

  const updateRow = (uid: string, patch: Partial<EditableRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.uid !== uid) return r;
        const merged: EditableRow = { ...r, ...patch };
        if ('quantity' in patch || 'unitPrice' in patch) {
          merged.totalAmount = round2((Number(merged.quantity) || 0) * (Number(merged.unitPrice) || 0));
        }
        return merged;
      }),
    );
  };

  const removeRow = (uid: string) => {
    setRows((prev) => prev.filter((r) => r.uid !== uid));
  };

  const addRow = (category: 'ps' | 'mooe' | 'co') => {
    setRows((prev) => [
      ...prev,
      {
        uid: `new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        source: prev[0]?.source ?? '',
        category,
        subcategoryId: null,
        customSubcategoryLabel: null,
        itemName: '',
        spec: '',
        quantity: 1,
        unit: 'pcs',
        unitPrice: 0,
        totalAmount: 0,
        isNew: true,
      },
    ]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (rows.length === 0) {
      setSubmitError('At least one budget line item is required.');
      return;
    }

    if (overCeiling) {
      setSubmitError(
        `New grand total (${formatPHP(newTotal)}) exceeds the original ceiling (${formatPHP(baselineTotal)}). Adjust your line items so the total stays at or below the original.`,
      );
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setSubmitError('Please describe why the realignment is needed (at least 10 characters).');
      return;
    }

    // Validate every row up-front so the proponent doesn't get a vague Zod error from the server.
    for (const row of rows) {
      if (!row.itemName.trim()) {
        setSubmitError('Every line item needs an item name.');
        return;
      }
      if (!(Number(row.quantity) > 0)) {
        setSubmitError(`Quantity must be greater than 0 (item: ${row.itemName}).`);
        return;
      }
      if (Number(row.unitPrice) < 0) {
        setSubmitError(`Unit price cannot be negative (item: ${row.itemName}).`);
        return;
      }
      if (!row.source.trim()) {
        setSubmitError(`Funding source is required (item: ${row.itemName}).`);
        return;
      }
    }

    // File is required end-to-end. In revise mode we accept the previously-uploaded
    // file_url as-is if the proponent didn't pick a new one (so they don't have to
    // re-upload an unchanged document); otherwise they must upload now.
    const existingFileUrl = existingRealignment?.file_url ?? null;
    if (!file && !existingFileUrl) {
      setSubmitError(
        "A revised LIB document is required so R&D can verify the proposed changes. Please attach the file.",
      );
      return;
    }

    setSubmitting(true);
    try {
      let fileUrlForSubmit: string | null = existingFileUrl;
      if (file) {
        setUploading(true);
        fileUrlForSubmit = await uploadReportFile(file);
        setUploading(false);
      }

      if (!fileUrlForSubmit) {
        // Safety net — the file check above should have caught this.
        setSubmitError("A revised LIB document is required.");
        setSubmitting(false);
        return;
      }

      const items: RealignmentLineInput[] = rows.map((row, idx) => ({
        subcategoryId: row.subcategoryId,
        customSubcategoryLabel: row.customSubcategoryLabel,
        source: row.source,
        category: row.category,
        itemName: row.itemName,
        spec: row.spec || null,
        quantity: round2(row.quantity),
        unit: row.unit || null,
        unitPrice: round2(row.unitPrice),
        totalAmount: round2(row.totalAmount),
        displayOrder: idx + 1,
        notes: null,
      }));

      await requestBudgetRealignment({
        fundedProjectId,
        reason: reason.trim(),
        fileUrl: fileUrlForSubmit,
        items,
      });

      await Swal.fire({
        icon: 'success',
        title: 'Realignment submitted',
        text: 'Your realignment request is now in the R&D Project Funding queue for review.',
        confirmButtonColor: '#C8102E',
      });

      onSubmitted?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit realignment.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col max-h-[94vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#C8102E] to-[#E03A52] text-white">
          <div>
            <h3 className="font-bold text-lg">
              {isReviseMode ? 'Revise Budget Realignment' : 'Request Budget Realignment'}
            </h3>
            <p className="text-xs text-white/80">
              {isReviseMode
                ? 'Update your previous submission based on the R&D feedback below.'
                : 'Move money between line items without exceeding the original ceiling.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isReviseMode && existingRealignment?.review_note && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm flex items-start gap-2">
              <MessageSquareWarning className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
              <div className="flex-1">
                <p className="font-bold text-blue-800 mb-1">R&D requested a revision</p>
                <p className="text-blue-700 whitespace-pre-wrap">{existingRealignment.review_note}</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading current budget...
            </div>
          )}

          {loadError && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{loadError}</div>
            </div>
          )}

          {!loading && !loadError && (
            <>
              {/* Baseline reference */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div>
                  Editing against budget version <strong>v{versionNumber}</strong>. Modify, add, or remove rows below — your new grand total cannot exceed the original.
                </div>
                <div className="font-mono">Original total: <strong>{formatPHP(baselineTotal)}</strong></div>
              </div>

              {/* Editable rows grouped by category */}
              {(['ps', 'mooe', 'co'] as const).map((cat) => {
                const catRows = rows.filter((r) => r.category === cat);
                return (
                  <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {cat.toUpperCase()} — {CATEGORY_LABEL[cat]}
                      </div>
                      <button
                        onClick={() => addRow(cat)}
                        className="text-xs text-[#C8102E] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> Add line item
                      </button>
                    </div>
                    {catRows.length === 0 ? (
                      <div className="text-center text-xs text-gray-400 py-4">No {cat.toUpperCase()} items.</div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {catRows.map((row) => (
                          <div key={row.uid} className="p-2">
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Source"
                                value={row.source}
                                onChange={(e) => updateRow(row.uid, { source: e.target.value })}
                                className="col-span-2 px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-[#C8102E] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Item name *"
                                value={row.itemName}
                                onChange={(e) => updateRow(row.uid, { itemName: e.target.value })}
                                className="col-span-3 px-2 py-1.5 border border-gray-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#C8102E] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Spec"
                                value={row.spec}
                                onChange={(e) => updateRow(row.uid, { spec: e.target.value })}
                                className="col-span-2 px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-[#C8102E] outline-none"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Qty"
                                value={row.quantity || ''}
                                onChange={(e) => updateRow(row.uid, { quantity: parseFloat(e.target.value) || 0 })}
                                className="col-span-1 px-2 py-1.5 border border-gray-200 rounded text-xs font-mono text-right focus:ring-1 focus:ring-[#C8102E] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Unit"
                                value={row.unit}
                                onChange={(e) => updateRow(row.uid, { unit: e.target.value })}
                                className="col-span-1 px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-[#C8102E] outline-none"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                placeholder="Unit ₱"
                                value={row.unitPrice || ''}
                                onChange={(e) => updateRow(row.uid, { unitPrice: parseFloat(e.target.value) || 0 })}
                                className={`col-span-1 px-2 py-1.5 border border-gray-200 rounded text-xs font-mono text-right focus:ring-1 focus:ring-[#C8102E] outline-none ${NO_SPINNER_CLASS}`}
                              />
                              <div className="col-span-1 px-2 py-1.5 border border-gray-200 bg-gray-50 rounded text-xs font-mono text-right truncate" title={formatPHP(row.totalAmount)}>
                                {formatPHP(row.totalAmount)}
                              </div>
                              <button
                                onClick={() => removeRow(row.uid)}
                                className="col-span-1 p-1.5 text-gray-300 hover:text-red-500 transition-colors flex justify-center"
                                aria-label="Remove line item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {row.isNew && (
                              <div className="text-[10px] text-emerald-600 font-bold pl-1 mt-1">
                                + Added during realignment
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  Reason for realignment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="e.g. Equipment prices increased; reallocating from communication expenses to cover the difference."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">{reason.length}/2000 characters</p>
              </div>

              {/* File upload — required so R&D and higher-ups can verify the proposed
                  changes against the revised LIB. In revise mode, the previously-uploaded
                  file is kept unless the proponent explicitly replaces it. */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  Revised LIB document <span className="text-red-500">*</span>
                </label>
                <div
                  className={`border border-dashed rounded-lg p-3 flex items-center gap-3 ${
                    !file && !existingRealignment?.file_url ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50 flex items-center gap-1 shrink-0"
                  >
                    <FileUp className="w-3 h-3" />
                    {existingRealignment?.file_url && !file ? 'Replace file' : 'Choose file'}
                  </button>
                  <span className="text-xs text-gray-600 truncate flex-1">
                    {file ? (
                      <>
                        <strong>{file.name}</strong>
                        <span className="text-gray-400 ml-1">(new upload)</span>
                      </>
                    ) : existingRealignment?.file_url ? (
                      <>
                        <span className="text-emerald-600">Previously uploaded file kept.</span>{' '}
                        <span className="text-gray-400">Click "Replace file" to upload a new one.</span>
                      </>
                    ) : (
                      <span className="text-red-600">
                        Required. PDF / Word / image, max 5 MB.
                      </span>
                    )}
                  </span>
                  {file && (
                    <button
                      onClick={() => setFile(null)}
                      className="text-gray-300 hover:text-red-500 shrink-0"
                      aria-label="Clear selected file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>{submitError}</div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky footer */}
        {!loading && !loadError && (
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{formatPHP(baselineTotal)}</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="font-mono font-bold">{formatPHP(newTotal)}</span>
                  <span
                    className={`font-mono font-bold ml-2 ${
                      delta === 0 ? 'text-slate-500' : delta < 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    Δ {delta >= 0 ? '+' : ''}{formatPHP(delta)}
                  </span>
                </div>
                {overCeiling ? (
                  <div className="text-[11px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Exceeds ceiling by {formatPHP(Math.abs(remainingHeadroom))}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Under ceiling by {formatPHP(Math.abs(remainingHeadroom))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    uploading ||
                    overCeiling ||
                    rows.length === 0 ||
                    (!file && !existingRealignment?.file_url)
                  }
                  className="px-5 py-2 bg-[#C8102E] text-white rounded-lg text-sm font-medium hover:bg-[#a00c24] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting || uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploading ? 'Uploading...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Submit for review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealignmentFormModal;
