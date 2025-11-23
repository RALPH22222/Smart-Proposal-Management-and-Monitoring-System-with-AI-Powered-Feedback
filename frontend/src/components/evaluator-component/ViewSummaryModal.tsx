import {
  X,
  Building2,
  Users,
  Target,
  Calendar,
  DollarSign,
} from "lucide-react";

// Define interfaces for the data structure
interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

export interface Proposal {
  id: number;
  title: string;
  proponent: string;
  status: string;
  deadline: string;
  description: string;
  projectType: string;
  agency: string;
  cooperatingAgencies: string;
  rdStation: string;
  classification: string;
  sector: string;
  discipline: string;
  duration: string;
  startDate: string;
  endDate: string;
  budgetSources: BudgetSource[];
  budgetTotal: string;
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null | undefined;
}

export default function ProposalModal({
  isOpen,
  onClose,
  proposal,
}: ProposalModalProps) {
  if (!isOpen || !proposal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {proposal.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">Proposal Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Project Info */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C8102E]" />
                Project Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-600">Leader:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.proponent}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Agency:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.agency}
                  </p>
                </div>
              </div>
            </div>

            {/* Cooperating Agencies */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                Cooperating Agencies
              </h3>
              <p className="text-xs text-slate-700">
                {proposal.cooperatingAgencies}
              </p>
            </div>

            {/* Station & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  R&D Station
                </h3>
                <p className="text-xs text-slate-700">{proposal.rdStation}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Classification
                </h3>
                <p className="text-xs text-slate-700">
                  {proposal.classification}
                </p>
              </div>
            </div>

            {/* Sector & Discipline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C8102E]" />
                  Sector/Commodity
                </h3>
                <p className="text-xs text-slate-700">{proposal.sector}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Discipline
                </h3>
                <p className="text-xs text-slate-700">{proposal.discipline}</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" />
                Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-600">Duration:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.duration}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">Start Date:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.startDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-600">End Date:</span>
                  <p className="font-semibold text-slate-900">
                    {proposal.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Table */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8102E]" />
                Estimated Budget by Source
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
                        Source of Funds
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        PS
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        MOOE
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        CO
                      </th>
                      <th className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                        TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.budgetSources.map((budget, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="border border-slate-300 px-3 py-2 font-medium text-slate-800">
                          {budget.source}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.ps}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.mooe}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right text-slate-700">
                          {budget.co}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                          {budget.total}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold">
                      <td className="border border-slate-300 px-3 py-2 text-slate-900">
                        TOTAL
                      </td>
                      <td
                        className="border border-slate-300 px-3 py-2 text-right text-slate-900"
                        colSpan={3}
                      >
                        →
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-[#C8102E] text-sm">
                        {proposal.budgetTotal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                PS: Personal Services | MOOE: Maintenance and Other Operating
                Expenses | CO: Capital Outlay
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}