import React from 'react';
import {
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaArrowDown,
  FaArrowUp
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

  const calculateTotal = (field: 'ps' | 'mooe' | 'co' | 'total') => {
    return formData.budgetItems.reduce((sum, item) => sum + (item[field] || 0), 0);
  };

  // Helper function to handle number input changes
  const handleNumberChange = (id: number, field: string, value: string) => {
    // Convert empty string to 0, otherwise parse the number
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    onBudgetItemUpdate(id, field, numericValue);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FaMoneyBillWave className="text-[#C8102E] text-xl" />
          </div>
          Budget Requirements
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Required
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm font-semibold text-blue-800">
          Add budget items for each funding source
        </p>
        <button
          type="button"
          onClick={onBudgetItemAdd}
          className="px-6 py-3 text-white rounded-xl hover:bg-[#9d0d24] transition-all flex items-center gap-2"
          style={{ backgroundColor: '#C8102E' }}
        >
          <FaPlus className="w-4 h-4" />
          Add Budget Item
        </button>
      </div>

      {/* Budget Items */}
      <div className="space-y-4">
        {formData.budgetItems.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            {/* Source and PS - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  Source of Funds
                </label>
                <input
                  type="text"
                  value={item.source}
                  onChange={(e) => onBudgetItemUpdate(item.id, 'source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                  placeholder="Funding source"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  PS
                </label>
                <input
                  type="number"
                  value={item.ps === 0 ? '' : item.ps}
                  onChange={(e) => handleNumberChange(item.id, 'ps', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                  placeholder="₱0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* MOOE and CO - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  MOOE
                </label>
                <input
                  type="number"
                  value={item.mooe === 0 ? '' : item.mooe}
                  onChange={(e) => handleNumberChange(item.id, 'mooe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                  placeholder="₱0.00"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  CO
                </label>
                <input
                  type="number"
                  value={item.co === 0 ? '' : item.co}
                  onChange={(e) => handleNumberChange(item.id, 'co', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
                  placeholder="₱0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Expanded Details */}
            {item.isExpanded && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Details for {item.source || 'Budget Item'}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm"
                  rows={3}
                  placeholder="Enter additional budget details, justification, or notes..."
                />
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-600">Total: </span>
                  <span className="font-bold text-[#C8102E] text-lg">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onBudgetItemToggle(item.id)}
                  className="p-2 text-[#C8102E] hover:text-[#9d0d24] hover:bg-red-50 rounded-lg transition-colors"
                  title={item.isExpanded ? "Collapse details" : "Expand details"}
                >
                  {item.isExpanded ? <FaArrowUp className="w-4 h-4" /> : <FaArrowDown className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => onBudgetItemRemove(item.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={formData.budgetItems.length <= 1}
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div className="bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-xl p-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-600 uppercase mb-2">PS Total</div>
            <div className="text-xl font-bold text-gray-800">{formatCurrency(calculateTotal('ps'))}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 uppercase mb-2">MOOE Total</div>
            <div className="text-xl font-bold text-gray-800">{formatCurrency(calculateTotal('mooe'))}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 uppercase mb-2">CO Total</div>
            <div className="text-xl font-bold text-gray-800">{formatCurrency(calculateTotal('co'))}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 uppercase mb-2">Grand Total</div>
            <div className="text-2xl font-bold text-[#C8102E]">{formatCurrency(calculateTotal('total'))}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSection;