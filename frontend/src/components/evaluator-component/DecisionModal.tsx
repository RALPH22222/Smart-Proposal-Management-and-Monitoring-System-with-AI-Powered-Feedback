import { useState } from "react";
import { 
  ClipboardEdit, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  CalendarClock 
} from "lucide-react";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
  onSubmit: (_status: "accepted" | "rejected" | "extension", _remarks: string, _newDeadline?: string) => void;
}

export default function DecisionModal({
  isOpen,
  onClose,
  proposalTitle,
  onSubmit,
}: DecisionModalProps) {
  const [remarks, setRemarks] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [decision, setDecision] = useState<"accepted" | "rejected" | "extension" | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!decision) {
      setError("Please select a decision.");
      return;
    }
    
    if (decision === "extension" && !newDeadline) {
      setError("Please select a new requested deadline date.");
      return;
    }

    if (!remarks.trim()) {
      setError("Please provide comments or reasons for your decision.");
      return;
    }

    onSubmit(decision, remarks, newDeadline);
    
    // Reset form
    setRemarks("");
    setNewDeadline("");
    setDecision(null);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-[#C8102E]" />
            Evaluate Proposal
          </h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
            {proposalTitle}
          </p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Decision Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              
              {/* ACCEPT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setDecision("accepted");
                  if (error) setError("");
                }}
                className={`cursor-pointer relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "accepted"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-500 hover:text-emerald-600"
                }`}
              >
                {decision === "accepted" && (
                  <div className="absolute top-2 right-2 text-emerald-600">
                    <CheckCircle className="w-4 h-4 fill-emerald-100" />
                  </div>
                )}
                <CheckCircle className={`w-6 h-6 ${decision === "accepted" ? "text-emerald-600" : "text-current"}`} />
                <span className="font-bold text-xs sm:text-sm">Accept</span>
              </button>

              {/* EXTENSION BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setDecision("extension");
                  if (error) setError("");
                }}
                className={`cursor-pointer relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "extension"
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-500 hover:text-blue-600"
                }`}
              >
                {decision === "extension" && (
                  <div className="absolute top-2 right-2 text-blue-600">
                    <CheckCircle className="w-4 h-4 fill-blue-100" />
                  </div>
                )}
                <CalendarClock className={`w-6 h-6 ${decision === "extension" ? "text-blue-600" : "text-current"}`} />
                <span className="font-bold text-xs sm:text-sm">Extend</span>
              </button>

              {/* REJECT BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setDecision("rejected");
                  if (error) setError("");
                }}
                className={`cursor-pointer relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                    : "border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-500 hover:text-red-600"
                }`}
              >
                {decision === "rejected" && (
                  <div className="absolute top-2 right-2 text-red-600">
                    <CheckCircle className="w-4 h-4 fill-red-100" />
                  </div>
                )}
                <XCircle className={`w-6 h-6 ${decision === "rejected" ? "text-red-600" : "text-current"}`} />
                <span className="font-bold text-xs sm:text-sm">Reject</span>
              </button>

            </div>
          </div>

          {/* Dynamic Content Area */}
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* New Deadline Input (Only for Extension) */}
            {decision === "extension" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Requested New Deadline <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
            )}

            {/* Remarks / Reason Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {decision === "extension" ? "Reason for Extension" : "Evaluator Remarks"} <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] outline-none resize-none text-sm transition-all placeholder:text-slate-400"
                placeholder={decision === "extension" 
                  ? "Please explain why an extension is necessary..." 
                  : "Enter your detailed feedback, requirements, or reasons..."
                }
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600 font-medium animate-pulse">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!decision}
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm flex items-center gap-2 ${
              decision
                ? "bg-[#C8102E] hover:bg-[#A00C24] cursor-pointer"
                : "bg-slate-300 cursor-not-allowed"
            }`}
          >
            {decision === "extension" ? "Submit Request" : "Submit Evaluation"}
          </button>
        </div>
      </div>
    </div>
  );
}