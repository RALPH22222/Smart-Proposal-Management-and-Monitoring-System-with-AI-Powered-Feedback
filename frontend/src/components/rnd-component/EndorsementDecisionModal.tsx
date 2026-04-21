import { useState, useEffect } from "react";
import {
  ClipboardEdit,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  AlertTriangle, // Added for confirmation warning
  Building2,
  Mail,
  MessageSquare,
  Users,
  HandCoins,
  User,
} from "lucide-react";
import SecureImage from "../shared/SecureImage";
import type { BudgetRow, EvaluatorDecision } from "../../types/evaluator";



interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalTitle: string;
  department?: string;
  email?: string;
  budgetData?: BudgetRow[]; // Added optional budget data
  evaluatorDecisions?: EvaluatorDecision[];
  onSubmit: (
    status: "endorsed" | "revised" | "rejected",
    remarks: string,
    revisionDeadline?: string,
    includedEvaluatorIds?: string[],
  ) => void;
  proponentProfilePicture?: string | null;
}

// Define the default structured sections
const DEFAULT_SECTIONS = [
  "Title Assessment",
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

export default function EndorsementDecisionModal({
  isOpen,
  onClose,
  proposalTitle,
  department,
  email,
  budgetData = [], // Default to empty array if not provided
  evaluatorDecisions = [],
  proponentProfilePicture,
  onSubmit,
}: DecisionModalProps) {
  const [decision, setDecision] = useState<"endorsed" | "revised" | "rejected">("endorsed");
  const [remarks, setRemarks] = useState("");

  // Revised Logic
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [structuredRemarks, setStructuredRemarks] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(DEFAULT_SECTIONS[0]);
  const [revisionDeadline, setRevisionDeadline] = useState("2 Weeks (Default)");

  // Evaluator comments R&D chose to forward to the proponent (anonymized downstream).
  // Only shown/relevant when decision === "revised".
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>([]);

  // Confirmation Logic
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [error, setError] = useState("");

  // Calculate Grand Total for Budget
  const grandTotal = budgetData.reduce((acc, row) => acc + row.total, 0);

  // Evaluators whose comment is actually worth including (has content + a non-pending decision).
  const includableEvaluators = evaluatorDecisions.filter(
    (d) =>
      (d.comments || "").trim().length > 0 &&
      (d.comments || "").trim().toLowerCase() !== "no comment provided" &&
      !["pending", "in review", "declined", "extension requested"].includes(
        (d.decision || "").toLowerCase(),
      ),
  );

  useEffect(() => {
    if (isOpen) {
      setDecision("endorsed");
      setRemarks("");
      setStructuredRemarks({});
      setSections(DEFAULT_SECTIONS);
      setActiveTab(DEFAULT_SECTIONS[0]);
      setRevisionDeadline("2 Weeks (Default)");
      setSelectedEvaluatorIds([]);
      setError("");
      setShowConfirmation(false); // Reset confirmation
    }
  }, [isOpen]);

  const toggleEvaluatorSelection = (evaluatorId: string) => {
    setSelectedEvaluatorIds((prev) =>
      prev.includes(evaluatorId) ? prev.filter((id) => id !== evaluatorId) : [...prev, evaluatorId],
    );
  };

  if (!isOpen) return null;

  const handleProceedToConfirm = () => {
    if (decision === "revised") {
      const hasContent = Object.values(structuredRemarks).some(val => val.trim().length > 0);
      if (!hasContent) {
        setError("Please provide assessment comments in at least one section.");
        return;
      }
    } else if (decision === "rejected" || decision === "endorsed") {
      if (!remarks.trim()) {
        setError(`Please provide a justification/explanation for this ${decision === 'endorsed' ? 'endorsement' : 'rejection'}.`);
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

    onSubmit(
      decision,
      finalRemarks,
      decision === "revised" ? revisionDeadline : undefined,
      decision === "revised" ? selectedEvaluatorIds : undefined,
    );
    onClose();
  };

  const handleStructuredChange = (text: string) => {
    setStructuredRemarks(prev => ({ ...prev, [activeTab]: text }));
    if (error) setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] relative">

        {/* --- CONFIRMATION OVERLAY --- */}
        {showConfirmation && (
          <div className="absolute inset-0 z-10 bg-white/95 flex flex-col items-center justify-center p-8 animate-in fade-in duration-200 text-center">
            <div className={`p-4 rounded-full mb-4 ${decision === 'endorsed' ? 'bg-emerald-100 text-emerald-600' :
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
                className={`flex-1 px-4 py-3 text-sm font-bold text-white rounded-xl shadow-md transition-transform active:scale-95 ${decision === 'endorsed' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  decision === 'revised' ? 'bg-yellow-600 hover:bg-yellow-700' :
                    'bg-red-600 hover:bg-red-700'
                  }`}
              >
                Yes, {decision === 'endorsed' ? 'Endorse' : decision === 'revised' ? 'Revise' : 'Reject'}
              </button>
            </div>
          </div>
        )}

        <div className="p-6 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-start gap-4">
            {proponentProfilePicture ? (
              <SecureImage
                src={proponentProfilePicture}
                alt="Proponent"
                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardEdit className="w-5 h-5 text-[#C8102E]" />
                Manage Proposal
              </h3>
              <div className="flex flex-col mt-2 gap-2 text-sm text-slate-500">
                <p className="line-clamp-2 text-slate-700 font-medium">
                  {proposalTitle}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  {department && department !== "N/A" && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>{department}</span>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Decision Selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Select Action
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
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${decision === "endorsed"
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
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${decision === "revised"
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
                className={`cursor-pointer relative p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${decision === "rejected"
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
              /* --- REVISED VIEW --- */
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

                {/* --- Evaluator comment forwarding (anonymized to proponent) --- */}
                {includableEvaluators.length > 0 && (
                  <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2 mb-1">
                      <Users className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Forward Evaluator Comments
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Check any evaluator comments you want the proponent to see alongside your
                          own. The proponent will see them labeled as "Evaluator 1", "Evaluator 2",
                          never by name.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {includableEvaluators.map((ev) => {
                        const checked = selectedEvaluatorIds.includes(ev.evaluatorId);
                        return (
                          <label
                            key={ev.evaluatorId}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              checked
                                ? "border-amber-400 bg-white shadow-sm ring-1 ring-amber-300"
                                : "border-slate-200 bg-white hover:border-amber-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEvaluatorSelection(ev.evaluatorId)}
                              className="mt-1 h-4 w-4 accent-[#C8102E] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 truncate">
                                  {ev.evaluatorProfilePicture ? (
                                    <SecureImage
                                      src={ev.evaluatorProfilePicture}
                                      alt="Evaluator"
                                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                      <User className="w-3 h-3" />
                                    </div>
                                  )}
                                  <span className="text-sm font-semibold text-slate-800 truncate">
                                    {ev.evaluatorName}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                                  /^approve$/i.test(ev.decision)
                                    ? "text-emerald-700 bg-emerald-100"
                                    : /^revise$/i.test(ev.decision)
                                    ? "text-amber-700 bg-amber-100"
                                    : /^reject$/i.test(ev.decision)
                                    ? "text-red-700 bg-red-100"
                                    : "text-slate-700 bg-slate-100"
                                }`}>
                                  {ev.decision}
                                </span>
                              </div>
                              <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
                                <MessageSquare className="w-3 h-3 mt-0.5 text-slate-400 flex-shrink-0" />
                                <p className="line-clamp-3 whitespace-pre-wrap">{ev.comments}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- Evaluator Ratings Reference (reacts to active tab) --- */}
                {(() => {
                  const ratingKey =
                    activeTab === "Title Assessment" ? "title" :
                    activeTab === "Budget Assessment" ? "budget" :
                    activeTab === "Timeline Assessment" ? "timeline" : null;

                  const ratingDescriptions: Record<string, Record<number, string>> = {
                    title: {
                      5: "Title is concise, highly descriptive, accurately reflects the scope of the project, and is aligned with the research objectives",
                      4: "Title is clear, relevant, and provides a good indication of the project's focus and goals",
                      3: "Title is acceptable but could be more specific or better aligned with the project scope",
                      2: "Title is vague, overly broad, or does not clearly convey the project's purpose",
                      1: "Title is unclear, misleading, or irrelevant to the proposed research",
                    },
                    budget: {
                      5: "Budget is well-justified, realistic, efficiently allocated, with clear cost breakdown and sound financial management plan",
                      4: "Budget is appropriate with minor justification gaps or minor allocation concerns",
                      3: "Budget is acceptable but lacks detailed justification for some line items",
                      2: "Budget appears inflated or inadequately justified with unclear allocation logic",
                      1: "Budget is unrealistic, poorly justified, or raises concerns about cost efficiency",
                    },
                    timeline: {
                      5: "Timeline is realistic, well-structured with clear milestones, deliverables, and contingency buffers",
                      4: "Timeline is reasonable with appropriate milestones and reasonable contingency planning",
                      3: "Timeline is acceptable but somewhat ambitious or lacks detailed milestone descriptions",
                      2: "Timeline appears unrealistic, poorly structured, or lacks clear milestones",
                      1: "Timeline is not feasible, unclear, or unrealistic given the project scope",
                    },
                  };

                  const getRatingLabel = (v: number) =>
                    v === 5 ? "Excellent" : v === 4 ? "Very Good" : v === 3 ? "Good" : v === 2 ? "Fair" : "Poor";

                  const scoredEvaluators = ratingKey
                    ? evaluatorDecisions.filter(
                        (ev) =>
                          ev.ratings &&
                          (ev.ratings as any)[ratingKey] > 0 &&
                          !["pending", "in review", "declined", "extension requested"].includes(
                            (ev.decision || "").toLowerCase()
                          )
                      )
                    : [];

                  if (!ratingKey || scoredEvaluators.length === 0) return null;

                  return (
                    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluator Ratings</span>
                        <span className="text-xs text-slate-400">— {activeTab}</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {scoredEvaluators.map((ev) => {
                          const score = (ev.ratings as any)[ratingKey] as number;
                          const desc = ratingDescriptions[ratingKey][score];
                          const dotColor =
                            score >= 4 ? "bg-emerald-500" :
                            score === 3 ? "bg-amber-400" : "bg-red-400";
                          const scoreColor =
                            score >= 4 ? "text-emerald-700" :
                            score === 3 ? "text-amber-600" : "text-red-600";
                          return (
                            <div key={ev.evaluatorId} className="flex items-center gap-3 px-4 py-2.5">
                              <span className={`text-xl font-black tabular-nums ${scoreColor}`}>{score}</span>
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                              <div className="min-w-0">
                                <span className={`text-xs font-bold ${scoreColor}`}>{getRatingLabel(score)}</span>
                                <span className="text-[10px] text-slate-400 ml-1">· {ev.evaluatorName}</span>
                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{desc}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-800">Structured Comments</h4>
                  </div>
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                    {sections.map((section) => (
                      <button
                        key={section}
                        onClick={() => setActiveTab(section)}
                        className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors relative top-[1px] ${activeTab === section
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

                {/* Budget Requirements Section — Matches DetailedProposalModal Read-Only Layout */}
                {decision === "endorsed" && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <HandCoins className="w-4 h-4 text-[#C8102E]" />
                        Budget Requirements
                      </h4>
                    </div>

                    {budgetData.length > 0 ? (
                      <div className="p-4 space-y-4">
                        {budgetData.map((budget, index) => (
                          <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            {/* Card Header: Source Name & Total */}
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-700">
                                  <HandCoins className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source of Funds</p>
                                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{budget.source}</h4>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                                <p className="text-base font-bold text-[#C8102E]">{formatCurrency(budget.total)}</p>
                              </div>
                            </div>

                            {/* Category Summary Row */}
                            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                              <div className="px-4 py-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">PS</span>
                                <span className="text-xs font-bold text-slate-700">{formatCurrency(budget.ps)}</span>
                              </div>
                              <div className="px-4 py-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">MOOE</span>
                                <span className="text-xs font-bold text-slate-700">{formatCurrency(budget.mooe)}</span>
                              </div>
                              <div className="px-4 py-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">CO</span>
                                <span className="text-xs font-bold text-slate-700">{formatCurrency(budget.co)}</span>
                              </div>
                            </div>
                            {/* Category Details: Stacked Tables per DetailedProposalModal */}
                            <div className="divide-y divide-slate-100">
                              {/* PS */}
                              {budget.breakdown?.ps && budget.breakdown.ps.length > 0 && (
                                <div className="p-4">
                                  <h5 className="text-[12px] font-bold uppercase text-red-800 mb-2 flex items-center gap-1.5">Personal Services (PS)</h5>
                                  <div className="rounded-lg border border-slate-100 overflow-hidden">
                                    <table className="w-full text-[10px] table-fixed">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                          <th className="w-[18%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Subcategory</th>
                                          <th className="w-[25%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Item</th>
                                          <th className="w-[17%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Spec / Volume</th>
                                          <th className="w-[25%] text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Qty × Unit Price</th>
                                          <th className="w-[15%] text-right px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {budget.breakdown.ps.map((itm, i) => (
                                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-2 py-2 text-slate-500 truncate" title={itm.subcategory}>{itm.subcategory || '—'}</td>
                                            <td className="px-2 py-2 text-slate-800 font-bold truncate" title={itm.item}>{itm.item || '—'}</td>
                                            <td className="px-2 py-2 text-slate-500 italic truncate" title={itm.specifications}>{itm.specifications || '—'}</td>
                                            <td className="px-2 py-2 text-slate-600 text-center font-mono tabular-nums">
                                              {itm.quantity ? `${itm.quantity}${itm.unit ? ` ${itm.unit}` : ''} × ₱${Number(itm.unitPrice || 0).toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-2 py-2 text-slate-900 font-bold text-right whitespace-nowrap">{formatCurrency(itm.amount)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* MOOE */}
                              {budget.breakdown?.mooe && budget.breakdown.mooe.length > 0 && (
                                <div className="p-4">
                                  <h5 className="text-[12px] font-bold uppercase text-red-800 mb-2 flex items-center gap-1.5">Maintenance, Operating & Other Expenses (MOOE)</h5>
                                  <div className="rounded-lg border border-slate-100 overflow-hidden">
                                    <table className="w-full text-[10px] table-fixed">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                          <th className="w-[18%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Subcategory</th>
                                          <th className="w-[25%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Item</th>
                                          <th className="w-[17%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Spec / Volume</th>
                                          <th className="w-[25%] text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Qty × Unit Price</th>
                                          <th className="w-[15%] text-right px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {budget.breakdown.mooe.map((itm, i) => (
                                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-2 py-2 text-slate-500 truncate" title={itm.subcategory}>{itm.subcategory || '—'}</td>
                                            <td className="px-2 py-2 text-slate-800 font-bold truncate" title={itm.item}>{itm.item || '—'}</td>
                                            <td className="px-2 py-2 text-slate-500 italic truncate" title={itm.specifications}>{itm.specifications || '—'}</td>
                                            <td className="px-2 py-2 text-slate-600 text-center font-mono tabular-nums">
                                              {itm.quantity ? `${itm.quantity}${itm.unit ? ` ${itm.unit}` : ''} × ₱${Number(itm.unitPrice || 0).toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-2 py-2 text-slate-900 font-bold text-right whitespace-nowrap">{formatCurrency(itm.amount)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* CO */}
                              {budget.breakdown?.co && budget.breakdown.co.length > 0 && (
                                <div className="p-4">
                                  <h5 className="text-[12px] font-bold uppercase text-red-800 mb-2 flex items-center gap-1.5">Capital Outlay (CO)</h5>
                                  <div className="rounded-lg border border-slate-100 overflow-hidden">
                                    <table className="w-full text-[10px] table-fixed">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                          <th className="w-[18%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Subcategory</th>
                                          <th className="w-[25%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Item</th>
                                          <th className="w-[17%] text-left px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Spec / Volume</th>
                                          <th className="w-[25%] text-center px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Qty × Unit Price</th>
                                          <th className="w-[15%] text-right px-2 py-2 font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {budget.breakdown.co.map((itm, i) => (
                                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-2 py-2 text-slate-500 truncate" title={itm.subcategory}>{itm.subcategory || '—'}</td>
                                            <td className="px-2 py-2 text-slate-800 font-bold truncate" title={itm.item}>{itm.item || '—'}</td>
                                            <td className="px-2 py-2 text-slate-500 italic truncate" title={itm.specifications}>{itm.specifications || '—'}</td>
                                            <td className="px-2 py-2 text-slate-600 text-center font-mono tabular-nums">
                                              {itm.quantity ? `${itm.quantity}${itm.unit ? ` ${itm.unit}` : ''} × ₱${Number(itm.unitPrice || 0).toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-2 py-2 text-slate-900 font-bold text-right whitespace-nowrap">{formatCurrency(itm.amount)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Grand Total Footer */}
                        <div className="flex justify-end items-center gap-4 pt-2 border-t border-slate-200 mt-2">
                          <span className="text-sm font-bold text-slate-600 uppercase">Grand Total Requirements</span>
                          <span className="text-xl font-bold text-[#C8102E]">{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No budget data available for this proposal.
                      </div>
                    )}
                  </div>
                )}


                {(decision === "rejected" || decision === "endorsed") && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {decision === "endorsed" ? "Endorsement Justification" : "Rejection Explanation"}
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
                )}
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
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-all shadow-sm flex items-center gap-2 ${decision
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