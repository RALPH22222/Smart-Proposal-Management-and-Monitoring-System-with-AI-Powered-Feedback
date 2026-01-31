import React, { useState } from 'react';
import {
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaCalculator,
  FaCoins,
  FaListUl,
  FaTimes
} from 'react-icons/fa';
import type { ExpenseItem, FormData, BudgetItem } from '../../../../types/proponent-form';
import Tooltip from '../../../../components/Tooltip';

interface BudgetSectionProps {
  formData: FormData;
  onBudgetItemAdd: () => void;
  onBudgetItemRemove: (id: number) => void;
  onBudgetItemUpdate: (id: number, field: string, value: any) => void;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({
  formData,
  onBudgetItemAdd,
  onBudgetItemRemove,
  onBudgetItemUpdate,
}) => {
  const [activeModal, setActiveModal] = useState<{ itemId: number, category: 'ps' | 'mooe' | 'co' } | null>(null);

  const formatCurrency = (amount: number) => {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // --- FIX 1: SAFETY CHECK ---
  // Ensure item.budget exists before trying to access it
  const getBreakdown = (item: BudgetItem | undefined, category: 'ps' | 'mooe' | 'co'): ExpenseItem[] => {
    if (!item || !item.budget || !item.budget[category]) return [];
    return item.budget[category];
  };

  // --- FIX 2: UPDATE LOGIC FOR NESTED OBJECT ---
  // When adding/editing a breakdown, we must update the entire 'budget' object
  // and send it back to the parent.

  const updateBudgetStructure = (itemId: number, category: 'ps' | 'mooe' | 'co', newCategoryArray: ExpenseItem[]) => {
    const item = formData.budgetItems.find(i => i.id === itemId);
    if (!item) return;

    // Create copy of current budget object
    const updatedBudget = {
      ...item.budget,
      [category]: newCategoryArray
    };

    // Send the WHOLE budget object up to index.tsx
    onBudgetItemUpdate(itemId, 'budget', updatedBudget);
  };

  const handleAddBreakdownItem = () => {
    if (!activeModal) return;
    const { itemId, category } = activeModal;

    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);

    // Note: 'item' field maps to description in your previous code
    const newBreakdown = [
      ...currentBreakdown,
      { item: '', value: 0 } // Using ExpenseItem interface keys
    ];

    updateBudgetStructure(itemId, category, newBreakdown);
  };

  const handleUpdateBreakdownItem = (index: number, field: 'item' | 'value', value: string) => {
    if (!activeModal) return;
    const { itemId, category } = activeModal;

    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);

    const updatedBreakdown = [...currentBreakdown];
    updatedBreakdown[index] = {
      ...updatedBreakdown[index],
      [field]: field === 'value' ? Number(value) : value
    };

    updateBudgetStructure(itemId, category, updatedBreakdown);
  };

  const handleRemoveBreakdownItem = (index: number) => {
    if (!activeModal) return;
    const { itemId, category } = activeModal;

    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);

    const updatedBreakdown = currentBreakdown.filter((_, idx) => idx !== index);

    updateBudgetStructure(itemId, category, updatedBreakdown);
  };

  const calculateTotal = (field: 'ps' | 'mooe' | 'co' | 'total') => {
    return formData.budgetItems.reduce((grandTotal, item) => {
      // Helper function to sum up an array of ExpenseItems
      const getCategorySum = (items: ExpenseItem[] | undefined) => {
        if (!items) return 0;
        return items.reduce((sum, expense) => sum + (Number(expense.value) || 0), 0);
      };

      if (field === 'total') {
        const ps = getCategorySum(item.budget?.ps);
        const mooe = getCategorySum(item.budget?.mooe);
        const co = getCategorySum(item.budget?.co);
        return grandTotal + ps + mooe + co;
      } else {
        return grandTotal + getCategorySum(item.budget?.[field]);
      }
    }, 0);
  };

  const totalPS = calculateTotal('ps');
  const totalMOOE = calculateTotal('mooe');
  const totalCO = calculateTotal('co');
  const grandTotal = calculateTotal('total');

  return (
    <div className="space-y-8 relative">
      {/* Header (Same) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <FaMoneyBillWave className="text-[#C8102E] text-lg sm:text-xl" />
          </div>
          Budget Requirements
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full w-fit">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-blue-50 rounded-xl border border-blue-200 gap-4">
        <div className="text-sm text-blue-800">
          <span className="font-bold block mb-1">Instructions:</span>
          Add funding sources. For each category (PS, MOOE, CO), click the list icon to add detailed line items.
        </div>
        <button
          type="button"
          onClick={onBudgetItemAdd}
          className="w-full sm:w-auto px-6 py-3 text-white rounded-xl hover:bg-[#9d0d24] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          style={{ backgroundColor: '#C8102E' }}
        >
          <FaPlus className="w-4 h-4" />
          Add Funding Source
        </button>
      </div>

      <div className="space-y-4">
        {formData.budgetItems.map((item, index) => {
          // --- FIX 3: SAFE ACCESS ---
          // Safely calculate totals for this specific row using optional chaining
          const rowPS = item.budget?.ps?.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0) || 0;
          const rowMOOE = item.budget?.mooe?.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0) || 0;
          const rowCO = item.budget?.co?.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0) || 0;

          return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm relative group hover:border-gray-300 transition-colors">
              <div className="absolute -left-3 top-6 w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
                {index + 1}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Source Field */}
                <div className="lg:col-span-4 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 tracking-wide">
                    Source of Funds
                    <Tooltip content="The origin of the funding (e.g., General Appropriations Act, Local Government Units, Private Industry, etc.)" />
                  </label>
                  <input
                    type="text"
                    value={item.source}
                    onChange={(e) => onBudgetItemUpdate(item.id, 'source', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm font-medium"
                    placeholder="e.g., GAA, LGUs, Industry"
                  />
                </div>

                {/* PS Field */}
                <div className="lg:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 tracking-wide">
                    PS
                    <Tooltip content="Personnel Services - salaries, wages, allowances, and other benefits for project staff" position="right" />
                  </label>
                  <div 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center justify-between group/input"
                    onClick={() => setActiveModal({ itemId: item.id, category: 'ps' })}
                  >
                    <FaListUl className="text-gray-400 group-hover/input:text-[#C8102E]" />
                    <span>{formatCurrency(rowPS)}</span>
                  </div>
                </div>

                {/* MOOE Field */}
                <div className="lg:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 tracking-wide">
                    MOOE
                    <Tooltip content="Maintenance and Other Operating Expenses - utilities, supplies, repairs, transportation, communication, etc." position="right" />
                  </label>
                  <div 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center justify-between group/input"
                    onClick={() => setActiveModal({ itemId: item.id, category: 'mooe' })}
                  >
                    <FaListUl className="text-gray-400 group-hover/input:text-[#C8102E]" />
                    <span>{formatCurrency(rowMOOE)}</span>
                  </div>
                </div>

                {/* CO Field */}
                <div className="lg:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 tracking-wide">
                    CO
                    <Tooltip content="Capital Outlay - acquisition of fixed assets like equipment, machinery, vehicles, buildings, and infrastructure" position="right" />
                  </label>
                  <div 
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center justify-between group/input"
                    onClick={() => setActiveModal({ itemId: item.id, category: 'co' })}
                  >
                    <FaListUl className="text-gray-400 group-hover/input:text-[#C8102E]" />
                    <span>{formatCurrency(rowCO)}</span>
                  </div>
                </div>

                {/* Remove Action */}
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

      {/* Summary Totals Area (Same as yours, but using calculated totals) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <FaCalculator className="text-slate-500" />
          <h3 className="font-bold text-slate-700">Detailed Budget Breakdown</h3>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Personnel Services</p>
                  <p className="text-sm text-slate-600">Salaries, wages, honoraria</p>
                </div>
                <p className="text-xl font-bold text-slate-800 font-mono text-right">{formatCurrency(totalPS)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">MOOE</p>
                  <p className="text-sm text-slate-600">Maintenance & Operations</p>
                </div>
                <p className="text-xl font-bold text-slate-800 font-mono text-right">{formatCurrency(totalMOOE)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Capital Outlay</p>
                  <p className="text-sm text-slate-600">Equipment & Infrastructure</p>
                </div>
                <p className="text-xl font-bold text-slate-800 font-mono text-right">{formatCurrency(totalCO)}</p>
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
              <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- BREAKDOWN MODAL --- */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaListUl className="text-[#C8102E]" />
                {activeModal.category.toUpperCase()} Breakdown
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <FaTimes className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {getBreakdown(formData.budgetItems.find(i => i.id === activeModal.itemId), activeModal.category).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No line items added yet. Click "Add Item" to start.
                </div>
              ) : (
                getBreakdown(formData.budgetItems.find(i => i.id === activeModal.itemId), activeModal.category).map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start animate-in slide-in-from-bottom-2">
                    <span className="mt-3 text-xs text-gray-400 w-4">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder="Description (e.g. Travel, Supplies)"
                      value={item.item} // Changed from description to item based on type
                      onChange={(e) => handleUpdateBreakdownItem(idx, 'item', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.value || ''} // Changed from amount to value based on type
                      onChange={(e) => handleUpdateBreakdownItem(idx, 'value', e.target.value)}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-[#C8102E] focus:outline-none"
                    />
                    <button
                      onClick={() => handleRemoveBreakdownItem(idx)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-700">
                Total: <span className="text-[#C8102E] font-mono ml-2">
                  {formatCurrency(
                    getBreakdown(formData.budgetItems.find(i => i.id === activeModal.itemId), activeModal.category)
                      .reduce((sum, curr) => sum + (Number(curr.value) || 0), 0)
                  )}
                </span>
              </div>
              <button
                onClick={handleAddBreakdownItem}
                className="px-4 py-2 bg-[#C8102E] text-white rounded-lg text-sm font-medium hover:bg-[#a00c24] transition-colors flex items-center gap-2"
              >
                <FaPlus className="w-3 h-3" /> Add Item
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BudgetSection;