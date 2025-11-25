import { useState, useEffect } from "react";
import { 
  ClipboardEdit, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Plus,
  Trash2
} from "lucide-react";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
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

export default function DecisionModal({
  isOpen,
  onClose,
  proposalTitle,
  onSubmit,
}: DecisionModalProps) {
  // Set default decision to 'endorsed'
  const [decision, setDecision] = useState<"endorsed" | "revised" | "rejected">("endorsed");
  
  // State for simple remarks (Endorse/Reject)
  const [remarks, setRemarks] = useState("");
  
  // State for structured remarks (Revise)
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [structuredRemarks, setStructuredRemarks] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(DEFAULT_SECTIONS[0]);
  const [revisionDeadline, setRevisionDeadline] = useState("2 Weeks (Default)");
  
  const [error, setError] = useState("");

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDecision("endorsed");
      setRemarks("");
      setStructuredRemarks({});
      setSections(DEFAULT_SECTIONS);
      setActiveTab(DEFAULT_SECTIONS[0]);
      setRevisionDeadline("2 Weeks (Default)");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSection = () => {
    let counter = 1;
    // Find next available number
    while (sections.includes(`Additional Section ${counter}`)) {
      counter++;
    }
    const newSectionName = `Additional Section ${counter}`;
    setSections([...sections, newSectionName]);
    setActiveTab(newSectionName);
  };

  const handleDeleteSection = (sectionToDelete: string) => {
    // Prevent deleting default sections (just a safety check, UI should hide button anyway)
    if (DEFAULT_SECTIONS.includes(sectionToDelete)) return;

    const newSections = sections.filter(s => s !== sectionToDelete);
    setSections(newSections);

    // Clean up the remarks data for this section
    const newRemarks = { ...structuredRemarks };
    delete newRemarks[sectionToDelete];
    setStructuredRemarks(newRemarks);

    // Switch tab if the deleted one was active
    if (activeTab === sectionToDelete) {
      setActiveTab(newSections[0] || DEFAULT_SECTIONS[0]);
    }
  };

  const handleSubmit = () => {
    let finalRemarks = "";

    if (decision === "revised") {
      // Validate structured remarks: Ensure at least one section has content
      const hasContent = Object.values(structuredRemarks).some(val => val.trim().length > 0);
      
      if (!hasContent) {
        setError("Please provide assessment comments in at least one section.");
        return;
      }

      // Format the structured object into a readable string
      finalRemarks = Object.entries(structuredRemarks)
        .filter(([_, value]) => value.trim().length > 0)
        .map(([key, value]) => `[${key}]:\n${value}`)
        .join("\n\n");
    } else {
      // Validate simple remarks
      if (!remarks.trim()) {
        setError(
          decision === "endorsed" 
            ? "Please provide a justification for this endorsement." 
            : "Please provide an explanation for this rejection."
        );
        return;
      }
      finalRemarks = remarks;
    }

    // Pass revisionDeadline only if returning/revising
    onSubmit(decision, finalRemarks, decision === "revised" ? revisionDeadline : undefined);
    onClose();
  };

  // Helper to update structured remarks for specific tab
  const handleStructuredChange = (text: string) => {
    setStructuredRemarks(prev => ({
      ...prev,
      [activeTab]: text
    }));
    if (error) setError("");
  };

  // Check if current tab is a custom section (to show delete button)
  const isCustomSection = !DEFAULT_SECTIONS.includes(activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-[#C8102E]" />
            Manage Proposal
          </h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {proposalTitle}
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Decision Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Decision Action
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Endorse Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("endorsed");
                  setError("");
                }}
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "endorsed"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md transform scale-[1.02]"
                    : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "endorsed" && (
                  <div className="absolute top-2 right-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4 fill-emerald-100" />
                  </div>
                )}
                <CheckCircle
                  className={`w-6 h-6 ${
                    decision === "endorsed"
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }`}
                />
                <span className="font-bold text-sm">Endorse</span>
              </button>

              {/* Revise Button (formerly Return) */}
              <button
                type="button"
                onClick={() => {
                  setDecision("revised");
                  setError("");
                }}
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "revised"
                    ? "border-orange-500 bg-orange-50 text-orange-700 shadow-md transform scale-[1.02]"
                    : "border-slate-200 hover:border-orange-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "revised" && (
                  <div className="absolute top-2 right-2 text-orange-600">
                    <CheckCircle className="w-4 h-4 fill-orange-100" />
                  </div>
                )}
                <RotateCcw
                  className={`w-6 h-6 ${
                    decision === "revised"
                      ? "text-orange-600"
                      : "text-slate-300"
                  }`}
                />
                <span className="font-bold text-sm">Revise</span>
              </button>

              {/* Reject Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("rejected");
                  setError("");
                }}
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-md transform scale-[1.02]"
                    : "border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "rejected" && (
                  <div className="absolute top-2 right-2 text-red-600">
                    <CheckCircle className="w-4 h-4 fill-red-100" />
                  </div>
                )}
                <XCircle
                  className={`w-6 h-6 ${
                    decision === "rejected" ? "text-red-600" : "text-slate-300"
                  }`}
                />
                <span className="font-bold text-sm">Reject</span>
              </button>
            </div>
          </div>

          {/* Conditional Content Area */}
          <div className="animate-in fade-in duration-300">
            {decision === "revised" ? (
              /* Structured Comments Interface */
              <div className="space-y-6">
                
                {/* Revision Time Limit Section */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-2">Revision Time Limit</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Deadline for proponent to submit revision:
                  </p>
                  <select
                    value={revisionDeadline}
                    onChange={(e) => setRevisionDeadline(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] outline-none transition-all shadow-sm cursor-pointer"
                  >
                    {DEADLINE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    The proponent will be notified of this deadline for their revision.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-800">Structured Comments</h4>
                    <button 
                      onClick={handleAddSection}
                      className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-medium transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Section
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                    {sections.map((section) => (
                      <button
                        key={section}
                        onClick={() => setActiveTab(section)}
                        className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors relative top-[1px] ${
                          activeTab === section
                            ? "bg-[#C8102E] text-white border-t border-x border-[#C8102E]"
                            : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        {section}
                      </button>
                    ))}
                  </div>

                  {/* Input Area for Tab */}
                  <div className="bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">
                        {activeTab}
                      </label>
                      {isCustomSection && (
                        <button 
                          onClick={() => handleDeleteSection(activeTab)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                          title="Delete Section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] outline-none resize-none text-sm transition-all shadow-sm"
                      placeholder={`Enter your comments for ${activeTab.toLowerCase()}...`}
                      value={structuredRemarks[activeTab] || ""}
                      onChange={(e) => handleStructuredChange(e.target.value)}
                    />
                    <p className="text-right text-xs text-slate-400 mt-2">
                      {(structuredRemarks[activeTab] || "").length} characters
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Simple Textarea for Endorse/Reject */
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {decision === "endorsed" 
                    ? "Endorsement Justification" 
                    : "Rejection Explanation"} 
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] outline-none resize-none text-sm transition-all shadow-sm"
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
            onClick={handleSubmit}
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