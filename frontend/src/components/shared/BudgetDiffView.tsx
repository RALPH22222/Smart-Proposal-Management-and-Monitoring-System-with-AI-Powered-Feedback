import React, { useMemo } from 'react';
import { FaPlusCircle, FaMinusCircle, FaEdit, FaCheck, FaArrowRight } from 'react-icons/fa';
import type { BudgetVersionDto } from '../../services/ProjectMonitoringApi';

// Phase 3 of LIB feature: GitHub-style before/after diff for budget realignment review.
//
// Takes a "from" version (current baseline) and "to" version (proposed). When the realignment
// is still pending, the "to" side is the proposed_payload's items (synthetic — no DB row yet);
// after approval it's a real proposal_budget_versions row. The component handles both shapes
// via the `proposedItems` fallback prop.
//
// Classification:
//   - REMOVED:   present in `from` (matched by category + item_name + spec) but absent in `to`
//   - ADDED:     present in `to` but absent in `from`
//   - MODIFIED:  present in both, but quantity / unit / unit_price / total differs
//   - UNCHANGED: present in both with identical fields
//
// We intentionally do NOT match by the database `id` because pending realignments don't
// have DB rows yet on the "to" side. Matching by (category, item_name, spec) is good
// enough for typical LIB documents. Known edge case: duplicate items with the exact same
// (category, item_name, spec) collapse in the map and show as a single row — acceptable
// for LIBs, where duplicates are extremely rare.

type DiffStatus = 'unchanged' | 'modified' | 'added' | 'removed';

interface DiffRow {
  status: DiffStatus;
  category: 'ps' | 'mooe' | 'co';
  // Display values pulled from whichever side exists (or `to` for modified)
  itemName: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalAmount: number;
  // Original values for modified rows
  oldItemName?: string;
  oldSpec?: string | null;
  oldQuantity?: number;
  oldUnit?: string | null;
  oldUnitPrice?: number;
  oldTotalAmount?: number;
  // Optional grouping
  source?: string | null;
}

const CATEGORY_LABELS: Record<'ps' | 'mooe' | 'co', string> = {
  ps: 'Personnel Services',
  mooe: 'Maintenance & Other Operating Expenses',
  co: 'Capital Outlay / Equipment',
};

const formatPHP = (n: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(n || 0);

// Items can come in two shapes — DB rows (snake_case) and proposed payload entries (camelCase
// from the realignment-schema). Normalize both into a unified shape.
function normalizeItem(raw: any): {
  category: 'ps' | 'mooe' | 'co';
  source: string;
  itemName: string;
  spec: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  totalAmount: number;
} {
  return {
    category: (raw.category ?? 'mooe') as 'ps' | 'mooe' | 'co',
    source: raw.source ?? '',
    itemName: raw.item_name ?? raw.itemName ?? '',
    spec: raw.spec ?? null,
    quantity: Number(raw.quantity ?? 0),
    unit: raw.unit ?? null,
    unitPrice: Number(raw.unit_price ?? raw.unitPrice ?? 0),
    totalAmount: Number(raw.total_amount ?? raw.totalAmount ?? 0),
  };
}

function makeKey(item: ReturnType<typeof normalizeItem>): string {
  // Match items across versions by category + (case-insensitive) item name + spec.
  // Two items with the same name but different specs (e.g. Bond Paper A4 vs 8.5x13) are
  // distinct — including spec in the key keeps them separate.
  return `${item.category}|${item.itemName.trim().toLowerCase()}|${(item.spec ?? '').trim().toLowerCase()}`;
}

function rowsAreEqual(a: ReturnType<typeof normalizeItem>, b: ReturnType<typeof normalizeItem>): boolean {
  const round = (n: number) => Math.round(n * 100) / 100;
  return (
    round(a.quantity) === round(b.quantity) &&
    (a.unit ?? '') === (b.unit ?? '') &&
    round(a.unitPrice) === round(b.unitPrice) &&
    round(a.totalAmount) === round(b.totalAmount)
  );
}

export interface BudgetDiffViewProps {
  // Current baseline version (the "from" side). Always required.
  fromVersion: BudgetVersionDto | { items: any[]; grand_total: number; version_number?: number };
  // Approved/applied version, when the realignment has been accepted. Pass null while pending.
  toVersion?: BudgetVersionDto | null;
  // Proposed items (camelCase), used when toVersion is null (pending realignment) so we can
  // still render the diff against the in-flight proposal.
  proposedItems?: any[] | null;
  proposedGrandTotal?: number | null;
  // When true, hide unchanged rows so the diff isn't drowned in noise.
  hideUnchanged?: boolean;
}

export const BudgetDiffView: React.FC<BudgetDiffViewProps> = ({
  fromVersion,
  toVersion,
  proposedItems,
  proposedGrandTotal,
  hideUnchanged = false,
}) => {
  const { rows, fromTotal, toTotal } = useMemo(() => {
    const fromItems = (fromVersion?.items ?? []).map(normalizeItem);
    const toItemsRaw =
      toVersion?.items ??
      (proposedItems as any[] | undefined) ??
      [];
    const toItems = toItemsRaw.map(normalizeItem);

    const fromMap = new Map<string, ReturnType<typeof normalizeItem>>();
    fromItems.forEach((it) => fromMap.set(makeKey(it), it));
    const toMap = new Map<string, ReturnType<typeof normalizeItem>>();
    toItems.forEach((it) => toMap.set(makeKey(it), it));

    const seen = new Set<string>();
    const result: DiffRow[] = [];

    // First pass: walk `from` items in order, classify each as removed / unchanged / modified
    for (const fromItem of fromItems) {
      const key = makeKey(fromItem);
      seen.add(key);
      const toItem = toMap.get(key);
      if (!toItem) {
        result.push({
          status: 'removed',
          category: fromItem.category,
          itemName: fromItem.itemName,
          spec: fromItem.spec,
          quantity: fromItem.quantity,
          unit: fromItem.unit,
          unitPrice: fromItem.unitPrice,
          totalAmount: fromItem.totalAmount,
          source: fromItem.source,
        });
        continue;
      }
      if (rowsAreEqual(fromItem, toItem)) {
        result.push({
          status: 'unchanged',
          category: fromItem.category,
          itemName: fromItem.itemName,
          spec: fromItem.spec,
          quantity: fromItem.quantity,
          unit: fromItem.unit,
          unitPrice: fromItem.unitPrice,
          totalAmount: fromItem.totalAmount,
          source: fromItem.source,
        });
      } else {
        result.push({
          status: 'modified',
          category: fromItem.category,
          itemName: toItem.itemName,
          spec: toItem.spec,
          quantity: toItem.quantity,
          unit: toItem.unit,
          unitPrice: toItem.unitPrice,
          totalAmount: toItem.totalAmount,
          oldItemName: fromItem.itemName,
          oldSpec: fromItem.spec,
          oldQuantity: fromItem.quantity,
          oldUnit: fromItem.unit,
          oldUnitPrice: fromItem.unitPrice,
          oldTotalAmount: fromItem.totalAmount,
          source: toItem.source,
        });
      }
    }

    // Second pass: anything in `to` we haven't seen is an addition
    for (const toItem of toItems) {
      const key = makeKey(toItem);
      if (seen.has(key)) continue;
      result.push({
        status: 'added',
        category: toItem.category,
        itemName: toItem.itemName,
        spec: toItem.spec,
        quantity: toItem.quantity,
        unit: toItem.unit,
        unitPrice: toItem.unitPrice,
        totalAmount: toItem.totalAmount,
        source: toItem.source,
      });
    }

    const fromTotalCalc = fromItems.reduce((s, it) => s + it.totalAmount, 0);
    const toTotalCalc =
      toItems.length > 0
        ? toItems.reduce((s, it) => s + it.totalAmount, 0)
        : (proposedGrandTotal ?? 0);

    return { rows: result, fromTotal: fromTotalCalc, toTotal: toTotalCalc };
  }, [fromVersion, toVersion, proposedItems, proposedGrandTotal]);

  const grouped = useMemo(() => {
    const out: Record<'ps' | 'mooe' | 'co', DiffRow[]> = { ps: [], mooe: [], co: [] };
    for (const row of rows) {
      if (hideUnchanged && row.status === 'unchanged') continue;
      out[row.category].push(row);
    }
    return out;
  }, [rows, hideUnchanged]);

  const counts = useMemo(() => {
    return {
      added: rows.filter((r) => r.status === 'added').length,
      removed: rows.filter((r) => r.status === 'removed').length,
      modified: rows.filter((r) => r.status === 'modified').length,
      unchanged: rows.filter((r) => r.status === 'unchanged').length,
    };
  }, [rows]);

  const grandDelta = toTotal - fromTotal;

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
          <FaPlusCircle className="text-green-600" /> <span className="font-bold text-green-700">{counts.added}</span> added
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
          <FaEdit className="text-amber-600" /> <span className="font-bold text-amber-700">{counts.modified}</span> modified
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
          <FaMinusCircle className="text-red-600" /> <span className="font-bold text-red-700">{counts.removed}</span> removed
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2">
          <FaCheck className="text-slate-500" /> <span className="font-bold text-slate-700">{counts.unchanged}</span> unchanged
        </div>
      </div>

      {/* Per-category rows */}
      {(['ps', 'mooe', 'co'] as const).map((cat) => {
        const list = grouped[cat];
        if (list.length === 0) return null;
        return (
          <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 border-b border-slate-200">
              {cat.toUpperCase()} — {CATEGORY_LABELS[cat]}
            </div>
            <div className="divide-y divide-gray-100">
              {list.map((row, idx) => (
                <DiffRowItem key={`${cat}-${idx}`} row={row} />
              ))}
            </div>
          </div>
        );
      })}

      {rows.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
          No line items to compare.
        </div>
      )}

      {/* Grand total footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm text-slate-600">
          <span className="font-bold">Grand total:</span> {formatPHP(fromTotal)}{' '}
          <FaArrowRight className="inline text-slate-400 mx-1" /> {formatPHP(toTotal)}
        </div>
        <div
          className={`text-sm font-bold font-mono ${
            grandDelta === 0
              ? 'text-slate-500'
              : grandDelta < 0
                ? 'text-green-600'
                : 'text-red-600'
          }`}
        >
          Δ {grandDelta >= 0 ? '+' : ''}
          {formatPHP(grandDelta)}
        </div>
      </div>
    </div>
  );
};

const STATUS_STYLES: Record<DiffStatus, { row: string; chip: string; label: string }> = {
  added: { row: 'bg-green-50', chip: 'bg-green-200 text-green-800', label: 'ADDED' },
  removed: { row: 'bg-red-50', chip: 'bg-red-200 text-red-800', label: 'REMOVED' },
  modified: { row: 'bg-amber-50', chip: 'bg-amber-200 text-amber-800', label: 'MODIFIED' },
  unchanged: { row: 'bg-white', chip: 'bg-slate-100 text-slate-600', label: 'UNCHANGED' },
};

const DiffRowItem: React.FC<{ row: DiffRow }> = ({ row }) => {
  const styles = STATUS_STYLES[row.status];

  return (
    <div className={`p-3 text-xs ${styles.row}`}>
      <div className="flex items-start gap-3">
        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${styles.chip}`}>
          {styles.label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 truncate">
            {row.itemName}
            {row.spec && <span className="text-gray-500 font-normal"> ({row.spec})</span>}
          </div>
          {row.status === 'modified' && row.oldItemName && (
            <div className="text-[10px] text-gray-500 line-through truncate mt-0.5">
              was: {row.oldItemName}
              {row.oldSpec && ` (${row.oldSpec})`}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right font-mono tabular-nums">
          {row.status === 'modified' ? (
            <>
              <div className="text-gray-700">
                {row.quantity} {row.unit ?? ''} @ {formatPHP(row.unitPrice)} = {formatPHP(row.totalAmount)}
              </div>
              <div className="text-[10px] text-gray-400 line-through">
                was {row.oldQuantity} {row.oldUnit ?? ''} @ {formatPHP(row.oldUnitPrice ?? 0)} = {formatPHP(row.oldTotalAmount ?? 0)}
              </div>
            </>
          ) : (
            <div className="text-gray-700">
              {row.quantity} {row.unit ?? ''} @ {formatPHP(row.unitPrice)} = <span className="font-bold">{formatPHP(row.totalAmount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetDiffView;
