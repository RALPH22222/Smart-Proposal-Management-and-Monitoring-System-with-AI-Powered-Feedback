import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaPlus,
  FaTrash,
  FaCalculator,
  FaCoins,
  FaListUl,
  FaFileWord,
  FaCheckCircle,
  FaExclamationTriangle,} from 'react-icons/fa';
import { X, Sparkles, HandCoins } from 'lucide-react';
import type { ExpenseItem, FormData, BudgetItem, BudgetSubcategory } from '../../../../types/proponent-form';
import Tooltip from '../../../../components/Tooltip';
import AutoFillBadge from '../../../../components/shared/AutoFillBadge';
import SkeletonPulse from '../../../../components/shared/SkeletonPulse';
import { useClickOutside } from '../../../../hooks/useClickOutside.ts';
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
  // Subcategory reference popover — codex-recommended: show the valid labels right at the
  // download step (before opening the file in Word), lazy-loaded from the live admin catalog.
  const [showSubcategoryPopover, setShowSubcategoryPopover] = useState(false);
  const [subcategoryList, setSubcategoryList] = useState<{
    ps: BudgetSubcategory[];
    mooe: BudgetSubcategory[];
    co: BudgetSubcategory[];
  } | null>(null);
  const [loadingSubcategoryList, setLoadingSubcategoryList] = useState(false);
  const subcategoryPopoverRef = useRef<HTMLDivElement>(null);

  useClickOutside(subcategoryPopoverRef, () => {
    if (showSubcategoryPopover) setShowSubcategoryPopover(false);
  });

  const handleToggleSubcategoryPopover = async () => {
    const next = !showSubcategoryPopover;
    setShowSubcategoryPopover(next);
    if (next && !subcategoryList && !loadingSubcategoryList) {
      setLoadingSubcategoryList(true);
      try {
        const [ps, mooe, co] = await Promise.all([
          fetchBudgetSubcategories('ps'),
          fetchBudgetSubcategories('mooe'),
          fetchBudgetSubcategories('co'),
        ]);
        setSubcategoryList({ ps, mooe, co });
      } catch {
        /* leave null; retry on next toggle */
      } finally {
        setLoadingSubcategoryList(false);
      }
    }
  };

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
      <style>{`
        @keyframes scrollLabel {
          0%, 15% { transform: translateX(0); }
          75%, 85% { transform: translateX(min(0px, calc(100cqw - 100%))); }
          95%, 100% { transform: translateX(0); }
        }
      `}</style>
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

      {/* Two-path guidance panel — redesigned as equal-width option cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Build your <span className="text-[#C8102E] font-bold">Budget</span></h3>
          <p className="text-sm text-gray-500 mt-1">Choose how you want to add your line items</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
            {/* Upload Template Card */}
            <div className="flex flex-col h-full">
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#C8102E]/10 text-[#C8102E] flex items-center justify-center shrink-0">
                    <FaFileWord className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Upload Template</h4>
                    <span className="text-xs text-gray-400">Recommended</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Download the WMSU template, fill it in Word, then import.
                </p>
                <div className="flex flex-col gap-2 mt-auto">
                  <a
                    href="/templates/wmsu-lib-template-v1.docx"
                    download="wmsu-lib-template-v1.docx"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <FaFileWord className="w-4 h-4 text-[#C8102E]" />
                    Download Template
                  </a>
                  <button
                    type="button"
                    onClick={onOpenLibImport}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8102E] rounded-lg text-sm font-medium text-white hover:bg-[#9d0d24] transition-colors shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Import Template
                  </button>
                </div>
              </div>
              {/* Subcategory reference */}
              <div className="mt-3 relative" ref={subcategoryPopoverRef}>
                <button
                  type="button"
                  onClick={handleToggleSubcategoryPopover}
                  className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FaListUl className="w-4 h-4" />
                  {showSubcategoryPopover ? 'Hide' : 'View'} valid subcategories
                </button>
                {showSubcategoryPopover && (
                  <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 p-4 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-900">Valid Subcategories</span>
                      <button
                        type="button"
                        onClick={() => setShowSubcategoryPopover(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {loadingSubcategoryList && (
                      <div className="space-y-3 py-2">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <SkeletonPulse className="h-4 w-8 rounded" />
                            <SkeletonPulse className="h-3 w-full rounded" />
                            <SkeletonPulse className="h-3 w-3/4 rounded" />
                          </div>
                          <div className="space-y-2">
                            <SkeletonPulse className="h-4 w-10 rounded" />
                            <SkeletonPulse className="h-3 w-full rounded" />
                            <SkeletonPulse className="h-3 w-3/4 rounded" />
                          </div>
                          <div className="space-y-2">
                            <SkeletonPulse className="h-4 w-6 rounded" />
                            <SkeletonPulse className="h-3 w-full rounded" />
                            <SkeletonPulse className="h-3 w-3/4 rounded" />
                          </div>
                        </div>
                      </div>
                    )}
                    {!loadingSubcategoryList && subcategoryList && (
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        {(['ps', 'mooe', 'co'] as const).map((cat) => (
                          <div key={cat}>
                            <div className="font-semibold text-gray-700 uppercase text-[10px] tracking-wide mb-1">
                              {cat === 'ps' ? 'PS' : cat === 'mooe' ? 'MOOE' : 'CO'}
                            </div>
                            <ul className="space-y-0.5 text-gray-600">
                              {subcategoryList[cat].slice(0, 4).map((s) => (
                                <li key={s.id} className="truncate">• {s.label}</li>
                              ))}
                              {subcategoryList[cat].length > 4 && (
                                <li className="text-gray-400 italic">+ {subcategoryList[cat].length - 4} more</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* OR Divider */}
            <div className="hidden md:flex flex-col items-center justify-center px-2">
              <div className="w-px flex-1 bg-gray-200"></div>
              <span className="text-xs font-medium text-gray-400 tracking-widest py-2">OR</span>
              <div className="w-px flex-1 bg-gray-200"></div>
            </div>
            <div className="flex md:hidden items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs font-medium text-gray-400 tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Enter Manually Card */}
            <div className="flex flex-col h-full">
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    <FaPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Enter Manually</h4>
                    <span className="text-xs text-gray-400">Alternative</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  Add funding sources and enter budget items directly in the form.
                </p>
                <button
                  type="button"
                  onClick={onBudgetItemAdd}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Funding Source
                </button>
              </div>
            </div>
          </div>

          {/* Info note below cards */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-sm text-gray-500">
            <FaCoins className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
            <span>
              <strong className="text-gray-700">PS, MOOE, and CO are each optional</strong> — but every funding source
              must have at least one line item in one of them. Proposals like AMBIANCE, which have no Personnel Services,
              are fully supported.
            </span>
          </div>
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

              <div className="flex flex-col gap-4">
                {/* Row 1: Source of Funds */}
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${item.source ? 'text-green-600' : 'text-gray-500'}`}>
                    <span>Source of Funds</span>
                    <span className="text-red-500">*</span>
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

                {/* Row 2: PS / MOOE / CO Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* PS Card */}
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowPS > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>PS</span>
                      <span className="text-gray-400 font-normal text-[10px]">(optional)</span>
                      <Tooltip content="Personnel Services" position="right" />
                    </label>
                    <div
                      className={`w-full px-3 py-3 border rounded-lg text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input ${flaggedPS > 0 ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200' : 'border-gray-300 bg-gray-50'}`}
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

                  {/* MOOE Card */}
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowMOOE > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>MOOE</span>
                      <span className="text-gray-400 font-normal text-[10px]">(optional)</span>
                      <Tooltip content="Maintenance and Other Operating Expenses" position="right" />
                    </label>
                    <div
                      className={`w-full px-3 py-3 border rounded-lg text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input ${flaggedMOOE > 0 ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200' : 'border-gray-300 bg-gray-50'}`}
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

                  {/* CO Card */}
                  <div className="space-y-1.5">
                    <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowCO > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span>CO</span>
                      <span className="text-gray-400 font-normal text-[10px]">(optional)</span>
                      <Tooltip content="Capital Outlay" position="right" />
                    </label>
                    <div
                      className={`w-full px-3 py-3 border rounded-lg text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input ${flaggedCO > 0 ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-200' : 'border-gray-300 bg-gray-50'}`}
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
                </div>

                {/* Row 3: Remove Button */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => onBudgetItemRemove(item.id)}
                    className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    disabled={formData.budgetItems.length <= 1}
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                    <span>Remove</span>
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
          <div className="flex flex-col gap-6">
            {/* PS / MOOE / CO Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 items-stretch">
              {/* PS Card */}
              <div className="flex flex-col space-y-1.5 min-w-0">
                <div className="overflow-hidden" style={{ containerType: 'inline-size' }}>
                  <span className="text-[11px] lg:text-[12px] font-bold text-slate-500 whitespace-nowrap inline-block animate-[scrollLabel_8s_ease-in-out_infinite]">
                    Personnel Services
                  </span>
                </div>
                <div className="flex-1 bg-white px-3 lg:px-4 py-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all duration-200 flex items-center justify-between min-h-[48px] lg:min-h-[56px] min-w-0">
                  <FaListUl className="w-4 h-4 text-slate-400/70 shrink-0" />
                  <span className="text-sm lg:text-base font-semibold text-slate-700 font-mono truncate ml-3">{formatCurrency(totalPS)}</span>
                </div>
              </div>
              {/* MOOE Card */}
              <div className="flex flex-col space-y-1.5 min-w-0">
                <div className="overflow-hidden" style={{ containerType: 'inline-size' }}>
                  <span className="text-[11px] lg:text-[12px] font-bold text-slate-500 whitespace-nowrap inline-block animate-[scrollLabel_8s_ease-in-out_infinite]">
                    Maintenance and Other Operating Expenses
                  </span>
                </div>
                <div className="flex-1 bg-white px-3 lg:px-4 py-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all duration-200 flex items-center justify-between min-h-[48px] lg:min-h-[56px] min-w-0">
                  <FaListUl className="w-4 h-4 text-slate-400/70 shrink-0" />
                  <span className="text-sm lg:text-base font-semibold text-slate-700 font-mono truncate ml-3">{formatCurrency(totalMOOE)}</span>
                </div>
              </div>
              {/* CO Card */}
              <div className="flex flex-col space-y-1.5 min-w-0">
                <div className="overflow-hidden" style={{ containerType: 'inline-size' }}>
                  <span className="text-[11px] lg:text-[12px] font-bold text-slate-500 whitespace-nowrap inline-block animate-[scrollLabel_8s_ease-in-out_infinite]">
                    Capital Outlay
                  </span>
                </div>
                <div className="flex-1 bg-white px-3 lg:px-4 py-3 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all duration-200 flex items-center justify-between min-h-[48px] lg:min-h-[56px] min-w-0">
                  <FaListUl className="w-4 h-4 text-slate-400/70 shrink-0" />
                  <span className="text-sm lg:text-base font-semibold text-slate-700 font-mono truncate ml-3">{formatCurrency(totalCO)}</span>
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
    const newRowItem = newRow();
    updateBudgetStructure(itemId, category, [...currentBreakdown, newRowItem]);
    // Auto-focus on the new row's item name field after render
    setTimeout(() => {
      const inputs = document.querySelectorAll('[data-last-row="true"]');
      if (inputs.length > 0) {
        (inputs[inputs.length - 1] as HTMLInputElement).focus();
      }
    }, 50);
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

        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          {currentBreakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No line items added yet. Click "Add Item" to start.
            </div>
          ) : filteredBreakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              No items match <span className="font-semibold">"{searchQuery}"</span>{onlyFlagged ? ' with the "needs review" filter' : ''}.
              <button
                onClick={() => { setSearchQuery(''); setOnlyFlagged(false); }}
                className="ml-2 text-[#C8102E] font-semibold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                {/* Sticky Header */}
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 w-8">#</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 w-1/4">Subcategory</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 w-1/4">Item Name</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500">Spec / Volume</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-gray-500 w-16">Qty</th>
                    <th className="px-2 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-gray-500 w-20">Unit</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-gray-500 w-24">Unit ₱</th>
                    <th className="px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-gray-500 w-24">Total</th>
                    <th className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBreakdown.map(({ row, idx }) => {
                    const isOther = otherSubcategoryId != null && row.subcategoryId === otherSubcategoryId;
                    const needsReview = row.importConfidence === 'medium' || row.importConfidence === 'low';
                    return (
                      <tr
                        key={row.uid ?? idx}
                        className={`group hover:bg-gray-50/50 transition-colors ${
                          row.importConfidence === 'low'
                            ? 'bg-red-50/30'
                            : row.importConfidence === 'medium'
                              ? 'bg-amber-50/30'
                              : ''
                        }`}
                      >
                        {/* Row Number */}
                        <td className="px-3 py-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            needsReview
                              ? (row.importConfidence === 'low' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                              : 'bg-gray-100 text-gray-500'
                          }`}>{idx + 1}</div>
                        </td>

                        {/* Subcategory */}
                        <td className="px-2 py-2">
                          <div className="space-y-1">
                            <select
                              value={row.subcategoryId ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : Number(e.target.value);
                                handleRowChange(idx, {
                                  subcategoryId: val,
                                  customSubcategoryLabel: val !== otherSubcategoryId ? null : row.customSubcategoryLabel,
                                });
                              }}
                              disabled={loadingSubs}
                              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-[#C8102E] outline-none bg-white"
                            >
                              <option value="">Select</option>
                              {subcategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>{sub.label}</option>
                              ))}
                            </select>
                            {isOther && (
                              <input
                                type="text"
                                placeholder="Custom label"
                                value={row.customSubcategoryLabel ?? ''}
                                onChange={(e) => handleRowChange(idx, { customSubcategoryLabel: e.target.value })}
                                maxLength={120}
                                className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded focus:ring-2 focus:ring-[#C8102E] outline-none"
                              />
                            )}
                            {needsReview && (
                              <div className={`flex items-center gap-1 text-[10px] ${
                                row.importConfidence === 'low' ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                <FaExclamationTriangle className="w-3 h-3" />
                                <span className="truncate">{row.importConfidence === 'low' ? 'Needs review' : 'Review'}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Item Name */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={row.itemName ?? ''}
                            onChange={(e) => handleRowChange(idx, { itemName: e.target.value })}
                            maxLength={200}
                            data-last-row={idx === currentBreakdown.length - 1}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-[#C8102E] outline-none"
                          />
                        </td>

                        {/* Spec */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="Specifications"
                            value={row.spec ?? ''}
                            onChange={(e) => handleRowChange(idx, { spec: e.target.value })}
                            maxLength={200}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-[#C8102E] outline-none"
                          />
                        </td>

                        {/* Quantity */}
                        <td className="px-2 py-2">
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
                            className="w-full px-1 py-1 text-xs border border-gray-200 rounded text-right font-mono focus:ring-2 focus:ring-[#C8102E] outline-none"
                          />
                        </td>

                        {/* Unit */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="Unit"
                            value={row.unit ?? ''}
                            onChange={(e) => handleRowChange(idx, { unit: e.target.value })}
                            maxLength={40}
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-[#C8102E] outline-none"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={row.unitPrice || ''}
                            onChange={(e) => handleRowChange(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className={`w-full px-1 py-1 text-xs border border-gray-200 rounded text-right font-mono focus:ring-2 focus:ring-[#C8102E] outline-none ${NO_SPINNER_CLASS}`}
                          />
                        </td>

                        {/* Total */}
                        <td className="px-2 py-2">
                          <div className="px-1 py-1 text-xs font-mono text-right text-gray-700">
                            {formatCurrency(row.totalAmount || 0)}
                          </div>
                        </td>

                        {/* Delete */}
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => handleRemoveBreakdownItem(idx)}
                            disabled={currentBreakdown.length <= 1}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all disabled:opacity-30"
                            aria-label="Remove line item"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between flex-shrink-0 gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
          {/* Total Summary - Now Prominent */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{activeModal.category.toUpperCase()} Total</p>
              <p className="text-2xl font-black text-[#C8102E] font-mono tracking-tight">{formatCurrency(breakdownTotal)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAddBreakdownItem}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-3 h-3" /> Add Item
            </button>
          </div>
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

  // Live subcategory reference — codex-recommended: show the valid labels in the import modal
  // (not stamped into the .docx where they'd go stale) so proponents can cross-check before
  // uploading. Lazy-loaded on expander toggle to avoid blocking modal open.
  const [showSubcategoryRef, setShowSubcategoryRef] = useState(false);
  const [subcategoryRef, setSubcategoryRef] = useState<{
    ps: BudgetSubcategory[];
    mooe: BudgetSubcategory[];
    co: BudgetSubcategory[];
  } | null>(null);
  const [loadingSubcategoryRef, setLoadingSubcategoryRef] = useState(false);

  const handleToggleSubcategoryRef = async () => {
    const next = !showSubcategoryRef;
    setShowSubcategoryRef(next);
    if (next && !subcategoryRef && !loadingSubcategoryRef) {
      setLoadingSubcategoryRef(true);
      try {
        const [ps, mooe, co] = await Promise.all([
          fetchBudgetSubcategories('ps'),
          fetchBudgetSubcategories('mooe'),
          fetchBudgetSubcategories('co'),
        ]);
        setSubcategoryRef({ ps, mooe, co });
      } catch {
        /* leave null; user can retry by toggling */
      } finally {
        setLoadingSubcategoryRef(false);
      }
    }
  };

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

      // Mapping rules for the Subcategory column at import time:
      //
      //   1. Template cell matches a catalog entry exactly   → subcategoryId = that entry's id,
      //                                                        customSubcategoryLabel = null
      //   2. Template cell has a value not in the catalog    → subcategoryId = the "Other"
      //                                                        subcategory's id, customSubcategoryLabel =
      //                                                        the original parsed text (so the user
      //                                                        sees their imported value, not a blank).
      //                                                        Without this, the custom-label input is
      //                                                        hidden and the dropdown reads as blank.
      //   3. Template cell is blank                          → subcategoryId = null (user picks in form),
      //                                                        customSubcategoryLabel = null
      const findOtherId = (cat: 'ps' | 'mooe' | 'co'): number | null =>
        subsByCategory[cat].find((s) => s.code === OTHER_SUBCATEGORY_CODE)?.id ?? null;

      const resolveSubcategory = (
        cat: 'ps' | 'mooe' | 'co',
        label: string | null,
      ): { subcategoryId: number | null; customSubcategoryLabel: string | null } => {
        if (!label || !label.trim()) {
          return { subcategoryId: null, customSubcategoryLabel: null };
        }
        const target = label.toLowerCase().trim();
        const match = subsByCategory[cat].find((s) => s.label.toLowerCase() === target);
        if (match) {
          return { subcategoryId: match.id, customSubcategoryLabel: null };
        }
        // Unknown label — park it under "Other" and preserve the original text as the custom
        // label so the user sees what was imported without having to touch the dropdown.
        return { subcategoryId: findOtherId(cat), customSubcategoryLabel: label.trim() };
      };

      const grouped: { ps: ExpenseItem[]; mooe: ExpenseItem[]; co: ExpenseItem[] } = {
        ps: [],
        mooe: [],
        co: [],
      };

      for (const it of itemsToImport) {
        const { subcategoryId, customSubcategoryLabel } = resolveSubcategory(it.category, it.subcategoryLabel);
        grouped[it.category].push({
          uid: `lib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          subcategoryId,
          customSubcategoryLabel,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative m-auto">
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
                Import WMSU LIB Template
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-normal">
                WMSU LIB Template v1 only. Other formats will be rejected — use the template or enter items manually in the budget form.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 overflow-y-auto px-4 py-6 space-y-2 relative">
          {/* File picker */}
          {!result && !parsing && (
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-3 text-center hover:border-[#C8102E] transition-colors">
              <FaFileWord className="w-8 h-8 text-gray-400 mx-auto mb-1.5" />
              <p className="text-gray-600 font-medium mb-1">Upload your filled WMSU LIB Template</p>
              <p className="text-xs text-gray-400 mb-2">
                Haven't downloaded the template yet?
                {' '}
                <a
                  href="/templates/wmsu-lib-template-v1.docx"
                  download="wmsu-lib-template-v1.docx"
                  className="text-blue-600 font-semibold underline hover:text-blue-800"
                >
                  Get it here
                </a>
                . Maximum size 5 MB.
              </p>
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

          {/* Valid-subcategory expander — only in the picker state (before upload). Live data
              from the admin catalog, so proponents see the authoritative list without us having
              to stamp it into the .docx where it would go stale. */}
          {!result && !parsing && (
            <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
              <button
                type="button"
                onClick={handleToggleSubcategoryRef}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FaListUl className="w-3.5 h-3.5 text-[#C8102E]" />
                  View valid subcategories
                  <span className="text-[10px] font-normal text-gray-400">(optional — the form dropdown also shows this list)</span>
                </span>
                <span className={`text-gray-400 transition-transform ${showSubcategoryRef ? 'rotate-90' : ''}`}>›</span>
              </button>
              {showSubcategoryRef && (
                <div className="border-t border-gray-200 p-3 bg-gray-50 max-h-[50vh] sm:max-h-none overflow-y-auto">
                  {loadingSubcategoryRef && (
                    <div className="text-xs text-gray-500 py-2 text-center">Loading latest list…</div>
                  )}
                  {!loadingSubcategoryRef && subcategoryRef && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      {(['ps', 'mooe', 'co'] as const).map((cat) => (
                        <div key={cat}>
                          <div className="font-bold text-[#C8102E] uppercase text-[10px] tracking-wider mb-1">
                            {cat === 'ps' ? 'Personnel Services' : cat === 'mooe' ? 'MOOE' : 'Capital Outlay'}
                          </div>
                          <ul className="space-y-0.5 text-gray-700">
                            {subcategoryRef[cat].map((s) => (
                              <li key={s.id}>• {s.label}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loadingSubcategoryRef && !subcategoryRef && (
                    <div className="text-xs text-red-600 py-2 text-center">Could not load subcategories. Try again shortly.</div>
                  )}
                </div>
              )}
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

          {/* Rejection card — shown when the upload is not in WMSU LIB Template v1 format.
              Gives proponents two clear paths forward: download the template, or close the modal
              and use manual entry in the budget form. */}
          {result?.rejected && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-full shrink-0">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-900 mb-1">
                    Upload rejected — not the WMSU LIB Template
                  </h3>
                  <p className="text-sm text-red-800">
                    {result.warnings[0] ?? 'This document does not match the WMSU LIB Template v1 format.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <a
                  href="/templates/wmsu-lib-template-v1.docx"
                  download="wmsu-lib-template-v1.docx"
                  className="flex-1 px-4 py-2.5 bg-[#C8102E] text-white text-sm font-semibold rounded-lg hover:bg-[#a00c24] transition-colors flex items-center justify-center gap-2"
                >
                  <FaFileWord className="w-4 h-4" />
                  Download WMSU LIB Template
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  Enter items manually instead
                </button>
              </div>
              <p className="text-xs text-red-700 pt-1 border-t border-red-200">
                Tip: fill in the template, save as .docx, then upload again. Or close this dialog and type items directly into the budget form below.
              </p>
            </div>
          )}

          {/* Preview — shown only when the parser accepted the document */}
          {result && !result.rejected && stats && (
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
          {result && !result.rejected && (
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
