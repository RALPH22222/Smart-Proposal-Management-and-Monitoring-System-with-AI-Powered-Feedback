import { useState, useEffect } from "react";
import { 
  ClipboardEdit, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Plus, 
  Trash2,
  AlertTriangle // Added for confirmation warning
} from "lucide-react";

// New Interface for Budget Data
export interface BudgetRow {
  source: string;
  ps: number;
  mooe: number;
  co: number;
  total: number;
}

interface AdminDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
  budgetData?: BudgetRow[]; // Added optional budget data
  onSubmit: (status: "endorsed" | "revised" | "rejected", remarks: string, revisionDeadline?: string) => void;
}

// Define the default structured sections
const DEFAULT_SECTIONS = [
  "Objectives Assessment",
  "Methodology Assessment",
  "Budget Assessment",
  "Timeline Assessment",
  "Overall Assessment"
];

// Revision deadline options
const DEADLINE_OPTIONS = [
  "1 Week",
  "2 Weeks (Default)",
  "3 Weeks",
  "1 Month",
  "6 Weeks",
  "2 Months"
];

const REJECTION_TEMPLATE = `After careful review of this proposal, we have determined that it does not meet the required standards for approval. The following concerns have been identified:

1. [Specify main concern]
2. [Additional concerns if any]

We recommend that the proponent address these issues before resubmission.`;

// Helper to format currency
const formatCurrency = (amount: number) => {
  return "₱" + amount.toLocaleString();
};

export default function AdminEndorsementDecisionModal({
  isOpen,
  onClose,
  proposalTitle,
  budgetData = [], // Default to empty array if not provided
  onSubmit,
}: AdminDecisionModalProps) {
  const [decision, setDecision] = useState<"endorsed" | "revised" | "rejected">("endorsed");
  const [remarks, setRemarks] = useState("");
  
  // Revised Logic
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [structuredRemarks, setStructuredRemarks] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(DEFAULT_SECTIONS[0]);
  const [revisionDeadline, setRevisionDeadline] = useState("2 Weeks (Default)");
  
  // Confirmation Logic
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [error, setError] = useState("");

  // Calculate Grand Total for Budget
  const grandTotal = budgetData.reduce((acc, row) => acc + row.total, 0);

  useEffect(() => {
    if (isOpen) {
      setDecision("endorsed");
      setRemarks("");
      setStructuredRemarks({});
      setSections(DEFAULT_SECTIONS);
      setActiveTab(DEFAULT_SECTIONS[0]);
      setRevisionDeadline("2 Weeks (Default)");
      setError("");
      setShowConfirmation(false); // Reset confirmation
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSection = () => {
    let counter = 1;
    while (sections.includes(`Additional Section ${counter}`)) {
      counter++;
    }
    const newSectionName = `Additional Section ${counter}`;
    setSections([...sections, newSectionName]);
    setActiveTab(newSectionName);
  };

  const handleDeleteSection = (sectionToDelete: string) => {
    if (DEFAULT_SECTIONS.includes(sectionToDelete)) return;
    const newSections = sections.filter(s => s !== sectionToDelete);
    setSections(newSections);
    const newRemarks = { ...structuredRemarks };
    delete newRemarks[sectionToDelete];
    setStructuredRemarks(newRemarks);
    if (activeTab === sectionToDelete) {
      setActiveTab(newSections[0] || DEFAULT_SECTIONS[0]);
    }
  };

  // Step 1: Validate and show confirmation
  const handleProceedToConfirm = () => {
    if (decision === "revised") {
      const hasContent = Object.values(structuredRemarks).some(val => val.trim().length > 0);
      if (!hasContent) {
        setError("Please provide assessment comments in at least one section.");
        return;
      }
    } else {
      if (!remarks.trim()) {
        setError(
          decision === "endorsed" 
            ? "Please provide a justification for this admin endorsement." 
            : "Please provide an explanation for this admin rejection."
        );
        return;
      }
    }
    // If valid, show confirmation screen
    setShowConfirmation(true);
  };

  // Step 2: Actually submit
  const handleFinalSubmit = () => {
    let finalRemarks = "";

    if (decision === "revised") {
      finalRemarks = Object.entries(structuredRemarks)
        .filter(([_, value]) => value.trim().length > 0)
        .map(([key, value]) => `[${key}]:\n${value}`)
        .join("\n\n");
    } else {
      finalRemarks = remarks;
    }

    onSubmit(decision, finalRemarks, decision === "revised" ? revisionDeadline : undefined);
    onClose();
  };

  const handleStructuredChange = (text: string) => {
    setStructuredRemarks(prev => ({ ...prev, [activeTab]: text }));
    if (error) setError("");
  };

  const isCustomSection = !DEFAULT_SECTIONS.includes(activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative">
        
        {/* --- CONFIRMATION OVERLAY --- */}
        {showConfirmation && (
           <div className="absolute inset-0 z-10 bg-white/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 text-center">
             <div className={`p-4 rounded-full mb-4 ${
               decision === 'endorsed' ? 'bg-emerald-100 text-emerald-600' :
               decision === 'revised' ? 'bg-yellow-100 text-yellow-600' :
               'bg-red-100 text-red-600'
             }`}>
               <AlertTriangle className="w-12 h-12" />
             </div>
             
             <h3 className="text-2xl font-bold text-slate-800 mb-2">Are you sure?</h3>
             <p className="text-slate-600 mb-8 max-w-md">
               You are about to <span className="font-bold">{decision}</span> the proposal <span className="italic">"{proposalTitle}"</span>. 
               {decision === 'revised' && " The proponent will be notified to revise their submission."}
               {decision === 'rejected' && " This action cannot be easily undone."}
               {decision === 'endorsed' && " This will move the proposal to the next stage."}
             </p>

             <div className="flex gap-3 w-full max-w-xs">
               <button
                 onClick={() => setShowConfirmation(false)}
                 className="flex-1 px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
               >
                 Go Back
               </button>
               <button
                 onClick={handleFinalSubmit}
                 className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-xl shadow-md transition-transform active:scale-95 ${
                    decision === 'endorsed' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    decision === 'revised' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-red-600 hover:bg-red-700'
                 }`}
               >
                 Yes, {decision === 'endorsed' ? 'Endorse' : decision === 'revised' ? 'Revise' : 'Reject'}
               </button>
             </div>
           </div>
        )}

        {/* --- MAIN MODAL HEADER --- */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-[#C8102E]" />
            Manage Proposal (Admin)
          </h3>
          <div className="flex justify-between items-end mt-1">
             <p className="text-sm text-slate-500 line-clamp-1 max-w-[70%]">
               {proposalTitle}
             </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Decision Selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Select Admin Action
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Endorse Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("endorsed");
                  setRemarks("");
                  setError("");
                }}
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "endorsed"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-500"
                    : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "endorsed" && (
                  <div className="absolute top-2 right-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4 fill-emerald-100" />
                  </div>
                )}
                <CheckCircle className={`w-6 h-6 ${decision === "endorsed" ? "text-emerald-600" : "text-slate-300"}`} />
                <span className="font-bold text-sm">Endorse</span>
              </button>

              {/* Revise Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("revised");
                  setRemarks("");
                  setError("");
                }}
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "revised"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-md ring-1 ring-yellow-500"
                    : "border-slate-200 hover:border-yellow-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "revised" && (
                  <div className="absolute top-2 right-2 text-yellow-600">
                    <CheckCircle className="w-4 h-4 fill-yellow-100" />
                  </div>
                )}
                <RotateCcw className={`w-6 h-6 ${decision === "revised" ? "text-yellow-600" : "text-slate-300"}`} />
                <span className="font-bold text-sm">Revise</span>
              </button>

              {/* Reject Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("rejected");
                  setRemarks(REJECTION_TEMPLATE);
                  setError("");
                }}
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm ring-1 ring-red-500"
                    : "border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "rejected" && (
                  <div className="absolute top-2 right-2 text-red-600">
                    <CheckCircle className="w-4 h-4 fill-red-100" />
                  </div>
                )}
                <XCircle className={`w-6 h-6 ${decision === "rejected" ? "text-red-600" : "text-slate-300"}`} />
                <span className="font-bold text-sm">Reject</span>
              </button>
            </div>
          </div>

          {/* Conditional Content Area */}
          <div className="animate-in fade-in duration-300">
            {decision === "revised" ? (
              /* --- REVISED VIEW (Unchanged) --- */
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Revision Time Limit</h4>
                  <select
                    value={revisionDeadline}
                    onChange={(e) => setRevisionDeadline(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#C8102E] outline-none"
                  >
                    {DEADLINE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-800">Structured Comments</h4>
                    <button onClick={handleAddSection} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-medium transition-colors">
                      <Plus className="w-3 h-3" /> Add Section
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                    {sections.map((section) => (
                      <button
                        key={section}
                        onClick={() => setActiveTab(section)}
                        className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors relative top-[1px] ${
                          activeTab === section
                            ? "bg-[#C8102E] text-white border-t border-x border-[#C8102E]"
                            : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                  <div className="bg-white relative">
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-slate-700">{activeTab}</label>
                        {isCustomSection && (
                          <button onClick={() => handleDeleteSection(activeTab)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                        )}
                     </div>
                    <textarea
                      className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none resize-none text-sm"
                      placeholder={`Enter your comments for ${activeTab.toLowerCase()}...`}
                      value={structuredRemarks[activeTab] || ""}
                      onChange={(e) => handleStructuredChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* --- ENDORSE / REJECT VIEW --- */
              <div className="space-y-6">
                
                {/* NEW BUDGET TABLE (Only for Endorsed) */}
                {decision === "endorsed" && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-[#C8102E] font-serif font-black text-lg">$</span>
                         Estimated Budget by Source
                      </h4>
                    </div>
                    
                    {budgetData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3">Source</th>
                              <th className="px-4 py-3 text-right">PS</th>
                              <th className="px-4 py-3 text-right">MOOE</th>
                              <th className="px-4 py-3 text-right">CO</th>
                              <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {budgetData.map((row, index) => (
                              <tr key={index} className="hover:bg-slate-50/50">
                                <td className="px-4 py-3 font-medium text-slate-700">{row.source}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(row.ps)}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(row.mooe)}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(row.co)}</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(row.total)}</td>
                              </tr>
                            ))}
                            {/* Grand Total Row */}
                            <tr className="bg-slate-50 border-t-2 border-slate-200">
                              <td colSpan={4} className="px-4 py-3 font-bold text-slate-800 tracking-wide">Grand Total</td>
                              <td className="px-4 py-3 text-right font-black text-[#C8102E] text-base">
                                {formatCurrency(grandTotal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No budget data available for this proposal.
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    {decision === "endorsed" ? "Endorsement Justification (Admin)" : "Rejection Explanation (Admin)"} 
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] outline-none resize-none text-sm transition-all shadow-sm"
                    placeholder={
                      decision === "endorsed"
                        ? "Provide a clear explanation for endorsing this proposal..."
                        : "Provide a clear explanation for rejecting this proposal..."
                    }
                    value={remarks}
                    onChange={(e) => {
                      setRemarks(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600 font-medium animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleProceedToConfirm} // Changed to open confirmation instead of submit
            disabled={!decision}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-2 ${
              decision
                ? "bg-[#C8102E] hover:bg-[#A00C24] hover:shadow-md cursor-pointer transform active:scale-95"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            {decision === "endorsed" ? "Confirm Endorsement" : decision === "revised" ? "Send for Revision" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
