import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaPlus,
  FaTrash,
  FaCalculator,
  FaCoins,
  FaListUl,
  FaFileWord,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMagic
} from 'react-icons/fa';
import { X, Sparkles, HandCoins } from 'lucide-react';
import type { ExpenseItem, FormData, BudgetItem, BudgetSubcategory } from '../../../../types/proponent-form';
import Tooltip from '../../../../components/Tooltip';
import AutoFillBadge from '../../../../components/shared/AutoFillBadge';
import {
  fetchBudgetSubcategories,
  parseLibDocument,
  type ParsedLibItemDto,
  type ParseLibResultDto,
} from '../../../../services/proposal.api';

interface BudgetSectionProps {
  formData: FormData;
  onBudgetItemAdd: () => void;
  onBudgetItemRemove: (id: number) => void;
  onBudgetItemUpdate: (id: number, field: string, value: any) => void;
  onOpenBudgetModal: (itemId: number, category: 'ps' | 'mooe' | 'co') => void;
  // Phase 2 of LIB feature: import callback. Receives parsed items already mapped
  // into the ExpenseItem shape, grouped by category, plus a user-supplied source name.
  // The parent decides whether to replace the empty default source row or append a new one.
  onLibImport: (
    grouped: { ps: ExpenseItem[]; mooe: ExpenseItem[]; co: ExpenseItem[] },
    sourceName: string,
  ) => void;
  onOpenLibImport: () => void;
  autoFilledFields?: Set<string>;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const sumLineTotals = (items?: ExpenseItem[]) =>
  (items ?? []).reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
const countFlagged = (items?: ExpenseItem[]) =>
  (items ?? []).reduce(
    (sum, item) =>
      sum + (item.importConfidence === 'low' || item.importConfidence === 'medium' ? 1 : 0),
    0,
  );

const BudgetSection: React.FC<BudgetSectionProps> = ({
  formData,
  onBudgetItemAdd,
  onBudgetItemRemove,
  onBudgetItemUpdate,
  onOpenBudgetModal,
  onOpenLibImport,
  autoFilledFields = new Set(),
}) => {

  const formatCurrency = (amount: number) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const calculateTotal = (field: 'ps' | 'mooe' | 'co' | 'total') => {
    return formData.budgetItems.reduce((grandTotal, item) => {
      if (field === 'total') {
        return grandTotal + sumLineTotals(item.budget?.ps) + sumLineTotals(item.budget?.mooe) + sumLineTotals(item.budget?.co);
      }
      return grandTotal + sumLineTotals(item.budget?.[field]);
    }, 0);
  };

  const totalPS = calculateTotal('ps');
  const totalMOOE = calculateTotal('mooe');
  const totalCO = calculateTotal('co');
  const grandTotal = calculateTotal('total');

  const totalFlagged = formData.budgetItems.reduce(
    (sum, it) =>
      sum +
      countFlagged(it.budget?.ps) +
      countFlagged(it.budget?.mooe) +
      countFlagged(it.budget?.co),
    0,
  );

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl">
            <HandCoins className="text-white w-6 h-6" />
          </div>
          Budget Requirements
          <AutoFillBadge fieldName="budget" autoFilledFields={autoFilledFields} />
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium select-none">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {totalFlagged > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl">
          <FaExclamationTriangle className="text-amber-600 w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900">
            <span className="font-bold block">
              {totalFlagged} imported {totalFlagged === 1 ? 'item needs' : 'items need'} review
            </span>
            <span className="text-xs text-amber-800">
              Categories with flagged items are outlined in amber below. Open each to confirm the parsed values, then the warnings will clear once you edit the rows.
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-blue-50 rounded-xl border border-blue-200 gap-4">
        <div className="text-sm text-blue-800">
          <span className="font-bold block mb-1">Instructions:</span>
          Add funding sources. For each category (PS, MOOE, CO), click the list icon to add line items with quantity, unit, and unit price.
          <span className="block mt-1 text-xs text-blue-700">Tip: already have a Line-Item Budget Word document? Click <strong>Generate from LIB</strong> to import it instead of typing.</span>
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenLibImport}
            className="w-full sm:w-auto px-5 py-3 text-[#C8102E] bg-white border-2 border-[#C8102E] font-semibold rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 duration-200"
          >
            <FaMagic className="w-4 h-4" />
            Generate from LIB
          </button>
          <button
            type="button"
            onClick={onBudgetItemAdd}
            className="w-full sm:w-auto px-5 py-3 text-white font-semibold rounded-xl hover:bg-[#9d0d24] hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 duration-200"
            style={{ backgroundColor: '#C8102E' }}
          >
            <FaPlus className="w-4 h-4" />
            Add Funding Source
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {formData.budgetItems.map((item, index) => {
          const rowPS = sumLineTotals(item.budget?.ps);
          const rowMOOE = sumLineTotals(item.budget?.mooe);
          const rowCO = sumLineTotals(item.budget?.co);
          const flaggedPS = countFlagged(item.budget?.ps);
          const flaggedMOOE = countFlagged(item.budget?.mooe);
          const flaggedCO = countFlagged(item.budget?.co);

          return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm relative group hover:border-gray-300 transition-colors">
              <div className="absolute -left-3 top-6 w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                {index + 1}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-4 space-y-2">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${item.source ? 'text-green-600' : 'text-gray-500'}`}>
                    Source of Funds <span className="text-red-500">*</span>
                    <Tooltip content="The origin of the funding" />
                  </label>
                  <input
                    type="text"
                    value={item.source}
                    onChange={(e) => onBudgetItemUpdate(item.id, 'source', e.target.value)}
                    maxLength={100}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm font-medium"
                    placeholder="e.g., GAA, LGUs, Industry"
                  />
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowPS > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    PS <span className="text-red-500">*</span>
                    <Tooltip content="Personnel Services" position="right" />
                  </label>
                  <div
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input ${flaggedPS > 0 ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200' : 'border-gray-300 bg-gray-50'}`}
                    onClick={() => onOpenBudgetModal(item.id, 'ps')}
                    title={flaggedPS > 0 ? `${flaggedPS} item${flaggedPS > 1 ? 's' : ''} need review` : undefined}
                  >
                    <FaListUl className={`shrink-0 mr-3 ${flaggedPS > 0 ? 'text-amber-600' : 'text-gray-400 group-hover/input:text-[#C8102E]'}`} />
                    <div className="flex-1 truncate">
                      <span>{formatCurrency(rowPS)}</span>
                    </div>
                    {flaggedPS > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 shrink-0">
                        <FaExclamationTriangle className="w-2.5 h-2.5" />
                        {flaggedPS}
                      </span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowMOOE > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    MOOE <span className="text-red-500">*</span>
                    <Tooltip content="Maintenance and Other Operating Expenses" position="right" />
                  </label>
                  <div
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input ${flaggedMOOE > 0 ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200' : 'border-gray-300 bg-gray-50'}`}
                    onClick={() => onOpenBudgetModal(item.id, 'mooe')}
                    title={flaggedMOOE > 0 ? `${flaggedMOOE} item${flaggedMOOE > 1 ? 's' : ''} need review` : undefined}
                  >
                    <FaListUl className={`shrink-0 mr-3 ${flaggedMOOE > 0 ? 'text-amber-600' : 'text-gray-400 group-hover/input:text-[#C8102E]'}`} />
                    <div className="flex-1 truncate">
                      <span>{formatCurrency(rowMOOE)}</span>
                    </div>
                    {flaggedMOOE > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 shrink-0">
                        <FaExclamationTriangle className="w-2.5 h-2.5" />
                        {flaggedMOOE}
                      </span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowCO > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    CO <span className="text-red-500">*</span>
                    <Tooltip content="Capital Outlay" position="right" />
                  </label>
                  <div
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input ${flaggedCO > 0 ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200' : 'border-gray-300 bg-gray-50'}`}
                    onClick={() => onOpenBudgetModal(item.id, 'co')}
                    title={flaggedCO > 0 ? `${flaggedCO} item${flaggedCO > 1 ? 's' : ''} need review` : undefined}
                  >
                    <FaListUl className={`shrink-0 mr-3 ${flaggedCO > 0 ? 'text-amber-600' : 'text-gray-400 group-hover/input:text-[#C8102E]'}`} />
                    <div className="flex-1 truncate">
                      <span>{formatCurrency(rowCO)}</span>
                    </div>
                    {flaggedCO > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 shrink-0">
                        <FaExclamationTriangle className="w-2.5 h-2.5" />
                        {flaggedCO}
                      </span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 flex items-center justify-end lg:pt-6">
                  <button
                    type="button"
                    onClick={() => onBudgetItemRemove(item.id)}
                    className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    disabled={formData.budgetItems.length <= 1}
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                    <span className="lg:hidden">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <FaCalculator className="text-slate-500" />
          <h3 className="font-bold text-slate-700">Detailed Budget Breakdown</h3>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-28 overflow-hidden">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Personnel Services</p>
                  <p className="text-sm text-slate-600">Salaries, wages, honoraria</p>
                </div>
                <div className="w-full text-right">
                  <p className="text-xl font-bold text-slate-800 font-mono truncate">{formatCurrency(totalPS)}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-28 overflow-hidden">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MOOE</p>
                  <p className="text-sm text-slate-600">Maintenance & Operations</p>
                </div>
                <div className="w-full text-right">
                  <p className="text-xl font-bold text-slate-800 font-mono truncate">{formatCurrency(totalMOOE)}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-28 overflow-hidden">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Capital Outlay</p>
                  <p className="text-sm text-slate-600">Equipment & Infrastructure</p>
                </div>
                <div className="w-full text-right">
                  <p className="text-xl font-bold text-slate-800 font-mono truncate">{formatCurrency(totalCO)}</p>
                </div>
              </div>
            </div>

            <div className="mt-2 bg-[#C8102E] text-white p-6 rounded-xl flex flex-col sm:flex-row justify-between items-center shadow-md">
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <div className="p-2 bg-white/20 rounded-full">
                  <FaCoins className="w-6 h-6 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-white/80 uppercase tracking-widest">Total Project Cost</p>
                  <p className="text-xs text-white/60">Grand Total of all funding sources</p>
                </div>
              </div>
              <div className="max-w-[150px] sm:max-w-xs lg:max-w-[280px] w-full text-right">
                <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight truncate flex-1">
                  {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// BudgetBreakdownModal — Phase 1 of LIB feature
// ============================================================
// Each row is now: subcategory dropdown | item name | spec/volume | qty | unit | unit price | total
// Total is always computed (qty * unit price) — never user-typed.
// Subcategory dropdown is admin-managed; choosing "Other" reveals a free-text label field.

const OTHER_SUBCATEGORY_CODE = 'other';
// Hide the browser's default number-input spinner — applied to price/amount inputs only
// because the teacher only wants the up/down arrow on counting fields (quantity), not on
// price fields where a nudge of 1 would silently overwrite a carefully-typed decimal.
const NO_SPINNER_CLASS =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
const newRow = (): ExpenseItem => ({
  uid: `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  subcategoryId: null,
  customSubcategoryLabel: null,
  itemName: '',
  spec: '',
  quantity: 1,
  unit: 'pcs',
  unitPrice: 0,
  totalAmount: 0,
});

export const BudgetBreakdownModal: React.FC<{
  formData: FormData,
  activeModal: { itemId: number, category: 'ps' | 'mooe' | 'co' },
  onClose: () => void,
  onBudgetItemUpdate: (id: number, field: string, value: any) => void
}> = ({ formData, activeModal, onClose, onBudgetItemUpdate }) => {
  const [subcategories, setSubcategories] = useState<BudgetSubcategory[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);

  // Load admin-managed subcategories filtered by the active category (ps/mooe/co).
  // Cached in proposal.api so flipping between modal categories is instant after the first hit.
  useEffect(() => {
    let cancelled = false;
    setLoadingSubs(true);
    setSubError(null);
    fetchBudgetSubcategories(activeModal.category)
      .then((data) => {
        if (!cancelled) setSubcategories(data);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load budget subcategories', err);
          setSubError('Could not load subcategory list. You can still type values; classification is optional.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSubs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeModal.category]);

  const otherSubcategoryId = useMemo(
    () => subcategories.find((s) => s.code === OTHER_SUBCATEGORY_CODE)?.id ?? null,
    [subcategories],
  );

  const getBreakdown = (item: BudgetItem | undefined, category: 'ps' | 'mooe' | 'co'): ExpenseItem[] => {
    if (!item || !item.budget || !item.budget[category]) return [];
    return item.budget[category];
  };

  const updateBudgetStructure = (itemId: number, category: 'ps' | 'mooe' | 'co', newCategoryArray: ExpenseItem[]) => {
    const item = formData.budgetItems.find(i => i.id === itemId);
    if (!item) return;
    const updatedBudget = { ...item.budget, [category]: newCategoryArray };
    onBudgetItemUpdate(itemId, 'budget', updatedBudget);
  };

  const handleAddBreakdownItem = () => {
    const { itemId, category } = activeModal;
    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);
    updateBudgetStructure(itemId, category, [...currentBreakdown, newRow()]);
  };

  const handleRowChange = (index: number, patch: Partial<ExpenseItem>) => {
    const { itemId, category } = activeModal;
    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);
    const updated = [...currentBreakdown];
    const merged: ExpenseItem = { ...updated[index], ...patch };

    // Always recompute total from qty * unit price so it stays consistent with backend validation.
    if ('quantity' in patch || 'unitPrice' in patch) {
      merged.totalAmount = round2((Number(merged.quantity) || 0) * (Number(merged.unitPrice) || 0));
    }

    updated[index] = merged;
    updateBudgetStructure(itemId, category, updated);
  };

  const handleRemoveBreakdownItem = (index: number) => {
    const { itemId, category } = activeModal;
    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);
    if (currentBreakdown.length <= 1) return;
    const updatedBreakdown = currentBreakdown.filter((_, idx) => idx !== index);
    updateBudgetStructure(itemId, category, updatedBreakdown);
  };

  const formatCurrency = (amount: number) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const currentItem = formData.budgetItems.find(i => i.id === activeModal.itemId);
  const currentBreakdown = getBreakdown(currentItem, activeModal.category);
  const breakdownTotal = sumLineTotals(currentBreakdown);

  // --- Review + search state ---
  // Search filter: matches against item name + spec + subcategory label (custom + picked)
  const [searchQuery, setSearchQuery] = useState('');
  // "Show only items that need review" quick filter — toggled from the review banner
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  // How many imported rows need human review (medium + low confidence = flagged)
  const flaggedCount = useMemo(
    () =>
      currentBreakdown.filter(
        (r) => r.importConfidence === 'medium' || r.importConfidence === 'low',
      ).length,
    [currentBreakdown],
  );

  // Indexed breakdown preserves original positions even when filtered, so
  // handleRowChange/remove use the real index from the unfiltered array.
  const indexedBreakdown = useMemo(
    () => currentBreakdown.map((row, idx) => ({ row, idx })),
    [currentBreakdown],
  );

  const filteredBreakdown = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return indexedBreakdown.filter(({ row }) => {
      if (onlyFlagged) {
        const flagged = row.importConfidence === 'medium' || row.importConfidence === 'low';
        if (!flagged) return false;
      }
      if (!needle) return true;
      const haystack = [
        row.itemName ?? '',
        row.spec ?? '',
        row.customSubcategoryLabel ?? '',
        subcategories.find((s) => s.id === row.subcategoryId)?.label ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [indexedBreakdown, searchQuery, onlyFlagged, subcategories]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl min-h-[500px] max-h-[95vh] flex flex-col overflow-hidden relative">
        {/* --- HEADER --- */}
        <div className="relative bg-white border-b border-gray-100 px-6 sm:px-8 py-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <FaListUl className="w-5 h-5 text-[#C8102E]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#C8102E] tracking-tight">
                {activeModal.category.toUpperCase()} Line Items
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-normal">
                Manage detailed breakdown for this budget source
              </p>
            </div>
          </div>
        </div>

        {subError && (
          <div className="px-4 py-2 bg-amber-50 text-amber-800 text-xs border-b border-amber-100">{subError}</div>
        )}
        {!subError && !loadingSubs && subcategories.length === 0 && (
          <div className="px-4 py-2 bg-amber-50 text-amber-800 text-xs border-b border-amber-100">
            Subcategory list is empty. Ask an admin to seed <code>budget_subcategories</code>. You can still type line items — classification is optional.
          </div>
        )}

        {/* Review + search toolbar — visible whenever there are line items */}
        {currentBreakdown.length > 0 && (
          <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Search input */}
            <div className="relative flex-1">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeModal.category.toUpperCase()} items by name, spec, or subcategory…`}
                className="w-full pl-8 pr-8 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 rounded"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Flagged count pill + quick filter toggle */}
            {flaggedCount > 0 && (
              <button
                onClick={() => setOnlyFlagged((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  onlyFlagged
                    ? 'bg-amber-500 text-white border border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                }`}
                title={onlyFlagged ? 'Showing only flagged items — click to show all' : 'Filter to show only items that need review'}
              >
                <FaExclamationTriangle className="w-3 h-3" />
                {flaggedCount} need{flaggedCount === 1 ? 's' : ''} review
                {onlyFlagged && <span className="ml-1">× filter on</span>}
              </button>
            )}
          </div>
        )}

        <div className="flex-1 bg-slate-50 px-3 py-4 overflow-y-auto space-y-2">
          {currentBreakdown.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              No line items added yet. Click "Add Item" to start.
            </div>
          ) : filteredBreakdown.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              No items match <span className="font-semibold">"{searchQuery}"</span>{onlyFlagged ? ' with the "needs review" filter' : ''}.
              <button
                onClick={() => { setSearchQuery(''); setOnlyFlagged(false); }}
                className="ml-2 text-[#C8102E] font-semibold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredBreakdown.map(({ row, idx }) => {
              const isOther = otherSubcategoryId != null && row.subcategoryId === otherSubcategoryId;
              const needsReview = row.importConfidence === 'medium' || row.importConfidence === 'low';
              const reviewStyles = row.importConfidence === 'low'
                ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200'
                : row.importConfidence === 'medium'
                  ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                  : 'border-gray-200';
              return (
                <div
                  key={row.uid ?? idx}
                  className={`bg-white border rounded-xl p-2.5 shadow-sm group animate-in slide-in-from-bottom-2 ${reviewStyles}`}
                >
                  {needsReview && (
                    <div className={`flex items-start gap-2 mb-2 px-2 py-1.5 rounded-md text-[11px] font-medium ${
                      row.importConfidence === 'low'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      <FaExclamationTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold uppercase tracking-wider mr-1">
                          {row.importConfidence === 'low' ? 'Needs review' : 'Review'}:
                        </span>
                        {row.importWarning ?? 'Imported from LIB with low parser confidence — verify the values are correct.'}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 mt-1 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      needsReview
                        ? (row.importConfidence === 'low' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                        : 'bg-gray-50 text-gray-400'
                    }`}>{idx + 1}</div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                      {/* Subcategory dropdown */}
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Subcategory</label>
                        <select
                          value={row.subcategoryId ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            handleRowChange(idx, {
                              subcategoryId: val,
                              // Clear the custom label if the user picks a non-Other subcategory.
                              customSubcategoryLabel: val !== otherSubcategoryId ? null : row.customSubcategoryLabel,
                            });
                          }}
                          disabled={loadingSubs}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none bg-white"
                        >
                          <option value="">— Select —</option>
                          {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.label}</option>
                          ))}
                        </select>
                        {isOther && (
                          <input
                            type="text"
                            placeholder="Custom subcategory label"
                            value={row.customSubcategoryLabel ?? ''}
                            onChange={(e) => handleRowChange(idx, { customSubcategoryLabel: e.target.value })}
                            maxLength={120}
                            className="mt-1 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#C8102E] outline-none"
                          />
                        )}
                      </div>

                      {/* Item name */}
                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Item Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Bond Paper"
                          value={row.itemName ?? ''}
                          onChange={(e) => handleRowChange(idx, { itemName: e.target.value })}
                          maxLength={200}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#C8102E] outline-none"
                        />
                      </div>

                      {/* Spec / Volume */}
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Spec / Volume</label>
                        <input
                          type="text"
                          placeholder="80GSM, A4"
                          value={row.spec ?? ''}
                          onChange={(e) => handleRowChange(idx, { spec: e.target.value })}
                          maxLength={200}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none"
                        />
                      </div>

                      {/* Quantity — integer only; block decimal/scientific input so "pcs" can't become 1.03 */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Qty *</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={row.quantity || ''}
                          onKeyDown={(e) => {
                            if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
                          }}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            handleRowChange(idx, { quantity: raw === '' ? 0 : parseInt(raw, 10) });
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono text-right focus:ring-2 focus:ring-[#C8102E] outline-none"
                        />
                      </div>

                      {/* Unit */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="Reams"
                          value={row.unit ?? ''}
                          onChange={(e) => handleRowChange(idx, { unit: e.target.value })}
                          maxLength={40}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none"
                        />
                      </div>

                      {/* Unit price — spinner hidden; prices should be typed, not nudged */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Unit ₱ *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={row.unitPrice || ''}
                          onChange={(e) => handleRowChange(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className={`w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono text-right focus:ring-2 focus:ring-[#C8102E] outline-none ${NO_SPINNER_CLASS}`}
                        />
                      </div>

                      {/* Total (computed) */}
                      <div className="md:col-span-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">Total</label>
                        <div className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-mono text-right bg-gray-50 truncate">
                          {formatCurrency(row.totalAmount || 0)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveBreakdownItem(idx)}
                      disabled={currentBreakdown.length <= 1}
                      className="p-2 mt-5 text-gray-300 hover:text-red-500 rounded-lg transition-all disabled:opacity-30"
                      aria-label="Remove line item"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0 gap-3">
          <div className="mr-auto text-sm font-semibold text-gray-700">
            {activeModal.category.toUpperCase()} Total: <span className="text-[#C8102E] font-mono">{formatCurrency(breakdownTotal)}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleAddBreakdownItem}
            className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors flex items-center gap-2"
          >
            <FaPlus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// LibImportModal — Phase 2 of LIB feature
// ============================================================
// Opens on "Generate from LIB" click. Three states:
//   1. picker     — waiting for the proponent to choose a .docx
//   2. parsing    — request in flight
//   3. preview    — parsed result; user reviews stats + warnings, sets a source name,
//                   chooses whether to include low-confidence rows, then clicks Import.
//
// The parser produces line items keyed by category (PS / MOOE / CO). On import we look up
// each row's subcategoryLabel against the admin-managed budget_subcategories table — if there's
// a case-insensitive match we set subcategoryId, otherwise we leave it null and the user picks
// later in the BudgetBreakdownModal.

const ConfidenceChip: React.FC<{ confidence: 'high' | 'medium' | 'low' }> = ({ confidence }) => {
  const styles = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-red-100 text-red-700 border-red-200',
  };
  const labels = {
    high: 'Confident',
    medium: 'Review',
    low: 'Needs review',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[confidence]}`}>
      {labels[confidence]}
    </span>
  );
};

const formatPHP = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n);

export const LibImportModal: React.FC<{
  onClose: () => void;
  onImport: (
    grouped: { ps: ExpenseItem[]; mooe: ExpenseItem[]; co: ExpenseItem[] },
    sourceName: string,
  ) => void;
}> = ({ onClose, onImport }) => {
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseLibResultDto | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [includeLowConfidence, setIncludeLowConfidence] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    // Always reset the input so the user can re-select the same file after a failed parse
    e.target.value = '';
    if (!f) return;

    setParsing(true);
    setParseError(null);
    setResult(null);
    try {
      const res = await parseLibDocument(f);
      setResult(res);
      // Try to default the source name to the file name minus extension, since LIB documents
      // are usually named after the project / funding source.
      const baseName = f.name.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ').trim();
      if (baseName && !sourceName) setSourceName(baseName);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to parse the document.';
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  };

  const stats = useMemo(() => {
    if (!result) return null;
    const high = result.items.filter((i) => i.confidence === 'high').length;
    const medium = result.items.filter((i) => i.confidence === 'medium').length;
    const low = result.items.filter((i) => i.confidence === 'low').length;
    const totalAmount = result.items.reduce((sum, it) => sum + it.totalAmount, 0);
    return { high, medium, low, totalAmount };
  }, [result]);

  const itemsToImport = useMemo(() => {
    if (!result) return [];
    return includeLowConfidence ? result.items : result.items.filter((i) => i.confidence !== 'low');
  }, [result, includeLowConfidence]);

  const handleImport = async () => {
    if (!result) return;
    if (!sourceName.trim()) {
      setParseError('Please enter a funding source name before importing.');
      return;
    }

    setImporting(true);
    setParseError(null);
    try {
      // Fetch all subcategories so we can map labels to IDs. Three parallel requests; results
      // are cached in proposal.api so subsequent imports are instant.
      const [psSubs, mooeSubs, coSubs] = await Promise.all([
        fetchBudgetSubcategories('ps'),
        fetchBudgetSubcategories('mooe'),
        fetchBudgetSubcategories('co'),
      ]);
      const subsByCategory: Record<'ps' | 'mooe' | 'co', BudgetSubcategory[]> = {
        ps: psSubs,
        mooe: mooeSubs,
        co: coSubs,
      };

      const findSubId = (cat: 'ps' | 'mooe' | 'co', label: string | null): number | null => {
        if (!label) return null;
        const target = label.toLowerCase().trim();
        const match = subsByCategory[cat].find((s) => s.label.toLowerCase() === target);
        return match?.id ?? null;
      };

      const grouped: { ps: ExpenseItem[]; mooe: ExpenseItem[]; co: ExpenseItem[] } = {
        ps: [],
        mooe: [],
        co: [],
      };

      for (const it of itemsToImport) {
        const matchedSubId = findSubId(it.category, it.subcategoryLabel);
        grouped[it.category].push({
          uid: `lib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          subcategoryId: matchedSubId,
          customSubcategoryLabel: matchedSubId == null ? it.subcategoryLabel : null,
          itemName: it.itemName,
          spec: it.spec,
          quantity: it.quantity || 1,
          unit: it.unit,
          unitPrice: it.unitPrice || 0,
          totalAmount: it.totalAmount || 0,
          // Carry the parser's confidence + warning into the form state so the
          // breakdown modal can highlight rows that need human review after import.
          importConfidence: it.confidence,
          importWarning: it.warning,
        });
      }

      onImport(grouped, sourceName.trim());
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to import the parsed items.';
      setParseError(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden relative m-auto">
        {/* --- HEADER --- */}
        <div className="relative bg-white border-b border-gray-100 px-6 sm:px-8 py-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <Sparkles className="w-5 h-5 text-[#C8102E]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#C8102E] tracking-tight">
                Generate from LIB document
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-normal">
                Import budget items from your file
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 overflow-y-auto px-4 py-6 space-y-2 relative">
          {/* File picker */}
          {!result && !parsing && (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-3 text-center hover:border-[#C8102E] transition-colors">
              <FaFileWord className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
              <p className="text-gray-600 font-medium mb-1">Upload your Line-Item Budget document</p>
              <p className="text-xs text-gray-400 mb-2">Maximum size 5 MB.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 bg-[#C8102E] text-white rounded-lg font-medium hover:bg-[#a00c24] transition-colors"
              >
                Choose file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Parsing state */}
          {parsing && (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#C8102E] mb-2" />
              <p className="text-gray-600 font-medium">Parsing your LIB document...</p>
            </div>
          )}

          {/* Error */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
              <FaExclamationTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>{parseError}</div>
            </div>
          )}

          {/* Preview */}
          {result && stats && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <p className="text-[12px] font-semibold text-slate-500">Items parsed</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{result.items.length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
                  <p className="text-[12px] font-semibold text-emerald-600 flex items-center gap-1">
                    <FaCheckCircle className="w-3 h-3" /> Confident
                  </p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">{stats.high + stats.medium}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5">
                  <p className="text-[12px] font-semibold text-amber-600 flex items-center gap-1">
                    <FaExclamationTriangle className="w-3 h-3" /> Needs review
                  </p>
                  <p className="text-lg font-black text-amber-700 mt-0.5">{stats.low}</p>
                </div>
                <div className="bg-[#C8102E]/5 border border-[#C8102E]/20 rounded-lg p-1.5">
                  <p className="text-[10px] font-semibold text-[#C8102E]">Total amount</p>
                  <p className="text-base font-black text-[#C8102E] mt-0.5 truncate" title={formatPHP(stats.totalAmount)}>
                    {formatPHP(stats.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Detected category badges */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="font-bold text-gray-500">Categories detected:</span>
                {(['ps', 'mooe', 'co'] as const).map((cat) => (
                  <span
                    key={cat}
                    className={`px-2 py-0.5 rounded-full border ${result.detected.categories[cat]
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                      }`}
                  >
                    {cat.toUpperCase()}
                  </span>
                ))}
                {result.detected.grandTotal != null && (
                  <span className="ml-auto text-gray-500">
                    Grand total in source: <strong>{formatPHP(result.detected.grandTotal)}</strong>
                  </span>
                )}
              </div>

              {/* Warnings list */}
              {result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-sm text-amber-800">
                  <p className="font-bold mb-0.5 flex items-center gap-1 text-xs">
                    <FaExclamationTriangle className="w-3 h-3" /> Parser warnings
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source name input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">
                  Funding source name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g. GAA, LGUs, Industry"
                  maxLength={100}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-0.5">
                  LIB documents don't always specify the funding source — pre-filled from the file name.
                </p>
              </div>

              {/* Include low confidence toggle */}
              {stats.low > 0 && (
                <label className="flex items-start gap-2 text-xs cursor-pointer select-none -mx-1 px-1">
                  <input
                    type="checkbox"
                    checked={includeLowConfidence}
                    onChange={(e) => setIncludeLowConfidence(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Also import the <strong>{stats.low}</strong> low-confidence row{stats.low === 1 ? '' : 's'} (you'll need to fix them manually after import).
                  </span>
                </label>
              )}

              {/* Item preview table — read only; the existing BudgetBreakdownModal handles editing post-import */}
              {itemsToImport.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 border-b border-gray-200">
                    Preview ({itemsToImport.length} item{itemsToImport.length === 1 ? '' : 's'})
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {itemsToImport.map((it: ParsedLibItemDto, idx) => (
                      <div key={idx} className="p-1.5 text-xs hover:bg-gray-50 grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-1 font-bold text-gray-500 uppercase">{it.category}</span>
                        <span className="col-span-5 truncate font-medium text-gray-700">
                          {it.itemName}
                          {it.spec && <span className="text-gray-400"> ({it.spec})</span>}
                        </span>
                        <span className="col-span-2 text-gray-500 font-mono text-right">
                          {it.quantity} {it.unit ?? ''}
                        </span>
                        <span className="col-span-2 text-gray-700 font-mono text-right">{formatPHP(it.totalAmount)}</span>
                        <span className="col-span-2 flex justify-end">
                          <ConfidenceChip confidence={it.confidence} />
                        </span>
                        {it.warning && (
                          <span className="col-span-12 text-amber-600 text-[10px] pl-12">⚠ {it.warning}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2 text-sm">
                  No items selected for import. Try enabling low-confidence rows above.
                </div>
              )}
            </>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {result && (
            <button
              onClick={handleImport}
              disabled={importing || itemsToImport.length === 0 || !sourceName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${itemsToImport.length} item${itemsToImport.length === 1 ? '' : 's'}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;
