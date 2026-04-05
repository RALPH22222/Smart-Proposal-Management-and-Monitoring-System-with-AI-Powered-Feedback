import React from 'react';
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
import AutoFillBadge from '../../../../components/shared/AutoFillBadge';

interface BudgetSectionProps {
  formData: FormData;
  onBudgetItemAdd: () => void;
  onBudgetItemRemove: (id: number) => void;
  onBudgetItemUpdate: (id: number, field: string, value: any) => void;
  onOpenBudgetModal: (itemId: number, category: 'ps' | 'mooe' | 'co') => void;
  autoFilledFields?: Set<string>;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({
  formData,
  onBudgetItemAdd,
  onBudgetItemRemove,
  onBudgetItemUpdate,
  onOpenBudgetModal,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-xl">
            <FaMoneyBillWave className="text-white w-6 h-6" />
          </div>
          Budget Requirements
          <AutoFillBadge fieldName="budget" autoFilledFields={autoFilledFields} />
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium select-none">
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
          className="w-full sm:w-auto px-6 py-3 text-white font-semibold rounded-xl hover:bg-[#9d0d24] hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 duration-200"
          style={{ backgroundColor: '#C8102E' }}
        >
          <FaPlus className="w-4 h-4" />
          Add Funding Source
        </button>
      </div>

      <div className="space-y-4">
        {formData.budgetItems.map((item, index) => {
          const rowPS = item.budget?.ps?.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0) || 0;
          const rowMOOE = item.budget?.mooe?.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0) || 0;
          const rowCO = item.budget?.co?.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0) || 0;

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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input"
                    onClick={() => onOpenBudgetModal(item.id, 'ps')}
                  >
                    <FaListUl className="text-gray-400 group-hover/input:text-[#C8102E] shrink-0 mr-3" />
                    <div className="flex-1 truncate">
                      <span>{formatCurrency(rowPS)}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowMOOE > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    MOOE <span className="text-red-500">*</span>
                    <Tooltip content="Maintenance and Other Operating Expenses" position="right" />
                  </label>
                  <div
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input"
                    onClick={() => onOpenBudgetModal(item.id, 'mooe')}
                  >
                    <FaListUl className="text-gray-400 group-hover/input:text-[#C8102E] shrink-0 mr-3" />
                    <div className="flex-1 truncate">
                      <span>{formatCurrency(rowMOOE)}</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-2">
                  <label className={`flex items-center gap-2 text-xs font-bold tracking-wide ${rowCO > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    CO <span className="text-red-500">*</span>
                    <Tooltip content="Capital Outlay" position="right" />
                  </label>
                  <div
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-right font-mono cursor-pointer hover:bg-gray-100 flex items-center group/input"
                    onClick={() => onOpenBudgetModal(item.id, 'co')}
                  >
                    <FaListUl className="text-gray-400 group-hover/input:text-[#C8102E] shrink-0 mr-3" />
                    <div className="flex-1 truncate">
                      <span>{formatCurrency(rowCO)}</span>
                    </div>
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

export const BudgetBreakdownModal: React.FC<{
  formData: FormData,
  activeModal: { itemId: number, category: 'ps' | 'mooe' | 'co' },
  onClose: () => void,
  onBudgetItemUpdate: (id: number, field: string, value: any) => void
}> = ({ formData, activeModal, onClose, onBudgetItemUpdate }) => {
  
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
    const newBreakdown = [...currentBreakdown, { item: '', value: 0 }];
    updateBudgetStructure(itemId, category, newBreakdown);
  };

  const handleDetailedUpdate = (index: number, desc: string, amount: number) => {
    const { itemId, category } = activeModal;
    const item = formData.budgetItems.find(i => i.id === itemId);
    const currentBreakdown = getBreakdown(item, category);
    const updatedBreakdown = [...currentBreakdown];
    updatedBreakdown[index] = { item: desc.trim(), value: Math.max(0, amount) };
    updateBudgetStructure(itemId, category, updatedBreakdown);
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FaListUl className="text-[#C8102E]" />
            {activeModal.category.toUpperCase()} Breakdown
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {currentBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No line items added yet. Click "Add Item" to start.
            </div>
          ) : (
            currentBreakdown.map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm group animate-in slide-in-from-bottom-2">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">{idx + 1}</div>
                    <input
                      type="text"
                      placeholder="Item Description"
                      value={item.item || ''}
                      onChange={(e) => handleDetailedUpdate(idx, e.target.value, item.value || 0)}
                      className="flex-1 bg-transparent border-b border-gray-200 focus:border-[#C8102E] px-1 py-1 text-sm font-medium focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2 pl-10 sm:pl-0 sm:w-1/3 shrink-0">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2 text-gray-400 text-sm font-mono">₱</span>
                      <input
                        type="number"
                        min="0"
                        value={item.value || ''}
                        onChange={(e) => handleDetailedUpdate(idx, item.item || '', parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#C8102E] outline-none font-mono"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveBreakdownItem(idx)}
                      disabled={currentBreakdown.length <= 1}
                      className="p-2 text-gray-300 hover:text-red-500 rounded-lg transition-all disabled:opacity-30"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="text-sm font-semibold text-gray-700">
            Total: <span className="text-[#C8102E] font-mono">{formatCurrency(currentBreakdown.reduce((sum, curr) => sum + (Number(curr.value) || 0), 0))}</span>
          </div>
          <button onClick={handleAddBreakdownItem} className="px-4 py-2 bg-[#C8102E] text-white rounded-lg text-sm font-medium hover:bg-[#a00c24] flex items-center gap-2">
            <FaPlus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;