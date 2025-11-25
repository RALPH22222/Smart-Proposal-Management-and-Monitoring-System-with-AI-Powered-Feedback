import { useState } from "react";
import { ClipboardEdit, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
  onSubmit: (status: "endorsed" | "returned" | "rejected", remarks: string) => void;
}

export default function DecisionModal({
  isOpen,
  onClose,
  proposalTitle,
  onSubmit,
}: DecisionModalProps) {
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState<"endorsed" | "returned" | "rejected" | null>(
    null
  );
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!decision) {
      setError("Please select a decision.");
      return;
    }
    if (!remarks.trim()) {
      setError("Please provide comments or reasons for your decision.");
      return;
    }

    onSubmit(decision, remarks);
    setRemarks("");
    setDecision(null);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardEdit className="w-5 h-5 text-[#C8102E]" />
            Endorsement Proposal
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
              {/* Endorse Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("endorsed");
                  if (error) setError("");
                }}
                className={`cursor-pointer relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "endorsed"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-slate-200 hover:border-emerald-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "endorsed" && (
                  <div className="absolute top-2 right-2 text-emerald-600">
                    <CheckCircle className="w-3 h-3 fill-emerald-100" />
                  </div>
                )}
                <CheckCircle
                  className={`w-6 h-6 ${
                    decision === "endorsed"
                      ? "text-emerald-600"
                      : "text-slate-300"
                  }`}
                />
                <span className="font-bold text-xs sm:text-sm">Endorse</span>
              </button>

              {/* Return Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("returned");
                  if (error) setError("");
                }}
                className={`cursor-pointer relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "returned"
                    ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                    : "border-slate-200 hover:border-orange-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "returned" && (
                  <div className="absolute top-2 right-2 text-orange-600">
                    <CheckCircle className="w-3 h-3 fill-orange-100" />
                  </div>
                )}
                <RotateCcw
                  className={`w-6 h-6 ${
                    decision === "returned"
                      ? "text-orange-600"
                      : "text-slate-300"
                  }`}
                />
                <span className="font-bold text-xs sm:text-sm">Return</span>
              </button>

              {/* Reject Button */}
              <button
                type="button"
                onClick={() => {
                  setDecision("rejected");
                  if (error) setError("");
                }}
                className={`cursor-pointer relative p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                  decision === "rejected"
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                    : "border-slate-200 hover:border-red-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                {decision === "rejected" && (
                  <div className="absolute top-2 right-2 text-red-600">
                    <CheckCircle className="w-3 h-3 fill-red-100" />
                  </div>
                )}
                <XCircle
                  className={`w-6 h-6 ${
                    decision === "rejected" ? "text-red-600" : "text-slate-300"
                  }`}
                />
                <span className="font-bold text-xs sm:text-sm">Reject</span>
              </button>
            </div>
          </div>

          {/* Remarks Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Research and Development Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] outline-none resize-none text-sm transition-all"
              placeholder="Enter your detailed feedback, requirements, or reasons for your decision..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError("");
              }}
            />
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
            className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm flex items-center gap-2 ${
              decision
                ? "bg-[#C8102E] hover:bg-[#A00C24] cursor-pointer"
                : "bg-slate-300 cursor-not-allowed"
            }`}
            disabled={!decision}
          >
            Submit Decision
          </button>
        </div>
      </div>
    </div>
  );
}