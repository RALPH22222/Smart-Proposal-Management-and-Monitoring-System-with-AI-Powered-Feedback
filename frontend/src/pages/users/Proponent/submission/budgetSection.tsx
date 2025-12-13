import React from 'react';
import {
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaCalculator,
  FaCoins
} from 'react-icons/fa';
import type { FormData } from '../../../../types/proponent-form';

interface BudgetSectionProps {
  formData: FormData;
  years: string[];
  onBudgetItemAdd: () => void;
  onBudgetItemRemove: (id: number) => void;
  onBudgetItemUpdate: (id: number, field: string, value: string | number) => void;
  onBudgetItemToggle: (id: number) => void;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({
  formData,
  onBudgetItemAdd,
  onBudgetItemRemove,
  onBudgetItemUpdate,
  onBudgetItemToggle
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Safe calculation that handles both numbers and strings (while typing)
  const calculateTotal = (field: 'ps' | 'mooe' | 'co' | 'total') => {
    return formData.budgetItems.reduce((sum, item) => {
      const val = Number(item[field]); // Convert string inputs to number for calc
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  // CHANGED: Pass the raw string value to the parent.
  // This allows you to type "1." or delete the content completely without it snapping back to "1" or "0".
  const handleNumberChange = (id: number, field: string, value: string) => {
    onBudgetItemUpdate(id, field, value);
  };

  const totalPS = calculateTotal('ps');
  const totalMOOE = calculateTotal('mooe');
  const totalCO = calculateTotal('co');
  const grandTotal = calculateTotal('total');

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Instructions & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-blue-50 rounded-xl border border-blue-200 gap-4">
        <div className="text-sm text-blue-800">
          <span className="font-bold block mb-1">Instructions:</span>
          Enter the funding source and amounts for Personnel Services (PS), MOOE, and Capital Outlay (CO).
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

      {/* Budget Items Inputs */}
      <div className="space-y-4">
        {formData.budgetItems.map((item, index) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm relative group hover:border-gray-300 transition-colors">
            
            {/* Row Number Badge */}
            <div className="absolute -left-3 top-6 w-6 h-6 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
              {index + 1}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              
              {/* Source Field */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Source of Funds
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  PS
                </label>
                <input
                  type="number"
                  value={item.ps}
                  onChange={(e) => handleNumberChange(item.id, 'ps', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm text-right font-mono"
                  placeholder="0.00"
                  step="any"
                />
              </div>

              {/* MOOE Field */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  MOOE
                </label>
                <input
                  type="number"
                  value={item.mooe}
                  onChange={(e) => handleNumberChange(item.id, 'mooe', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm text-right font-mono"
                  placeholder="0.00"
                  step="any"
                />
              </div>

              {/* CO Field */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  CO
                </label>
                <input
                  type="number"
                  value={item.co}
                  onChange={(e) => handleNumberChange(item.id, 'co', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm text-right font-mono"
                  placeholder="0.00"
                  step="any"
                />
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
        ))}
      </div>

      {/* Detailed Budget Breakdown Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
        <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <FaCalculator className="text-slate-500" />
            <h3 className="font-bold text-slate-700">Detailed Budget Breakdown</h3>
        </div>
        
        <div className="p-6">
            <div className="flex flex-col gap-4">
                {/* Breakdown Rows */}
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

                {/* Grand Total Row */}
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
    </div>
  );
};

export default BudgetSection;