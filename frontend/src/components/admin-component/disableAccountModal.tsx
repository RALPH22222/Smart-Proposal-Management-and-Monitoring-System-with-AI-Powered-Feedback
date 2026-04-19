import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Power, AlertTriangle, Users, ChevronDown } from "lucide-react";
import type { User } from "../../types/admin";
import { AccountApi, type ActiveAssignments, type ReassignmentPayload } from "../../services/admin/AccountApi";
import { fetchUsersByRole, type UserItem } from "../../services/proposal.api";
import SecureImage from "../shared/SecureImage";
import SkeletonPulse from "../shared/SkeletonPulse";

interface DisableAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (reassignments?: ReassignmentPayload) => void;
  isSubmitting?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  review_rnd: "R&D Review",
  under_evaluation: "Under Evaluation",
  revision_rnd: "Revision (R&D)",
  endorsed_for_funding: "Endorsed",
  revision_funding: "Revision (Funding)",
  pending: "Pending",
  for_review: "For Review",
  extend: "Extension Requested",
};

const STATUS_COLORS: Record<string, string> = {
  review_rnd: "bg-blue-100 text-blue-700",
  under_evaluation: "bg-amber-100 text-amber-700",
  revision_rnd: "bg-orange-100 text-orange-700",
  endorsed_for_funding: "bg-green-100 text-green-700",
  revision_funding: "bg-orange-100 text-orange-700",
  pending: "bg-gray-100 text-gray-700",
  for_review: "bg-blue-100 text-blue-700",
  extend: "bg-purple-100 text-purple-700",
};

type ModalStep = "loading" | "simple" | "reassign";

const DisableAccountModal: React.FC<DisableAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
  isSubmitting,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<ModalStep>("loading");
  const [assignments, setAssignments] = useState<ActiveAssignments | null>(null);
  const [rndCandidates, setRndCandidates] = useState<UserItem[]>([]);
  const [evaluatorCandidates, setEvaluatorCandidates] = useState<UserItem[]>([]);
  const [rndMappings, setRndMappings] = useState<Record<number, string>>({});
  const [evaluatorMappings, setEvaluatorMappings] = useState<Record<number, string>>({});
  const [bulkRnd, setBulkRnd] = useState("");
  const [bulkEvaluator, setBulkEvaluator] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setConfirmText("");
    setStep("loading");
    setAssignments(null);
    setRndCandidates([]);
    setEvaluatorCandidates([]);
    setRndMappings({});
    setEvaluatorMappings({});
    setBulkRnd("");
    setBulkEvaluator("");
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }

    if (!user) return;

    const isCurrentlyActive = !user.is_disabled;

    // If enabling, skip assignment check
    if (!isCurrentlyActive) {
      setStep("simple");
      return;
    }

    // Check for active assignments when disabling
    const loadAssignments = async () => {
      try {
        setStep("loading");
        setLoadError(null);
        const data = await AccountApi.checkActiveAssignments(user.id);
        setAssignments(data);

        if (!data.has_active_assignments) {
          setStep("simple");
          return;
        }

        // Load replacement candidates in parallel
        const promises: Promise<any>[] = [];

        if (data.rnd_assignments.length > 0) {
          promises.push(
            fetchUsersByRole("rnd").then((users) =>
              setRndCandidates(users.filter((u) => u.id !== user.id)),
            ),
          );
        }

        if (data.evaluator_assignments.length > 0) {
          promises.push(
            fetchUsersByRole("evaluator").then((users) =>
              setEvaluatorCandidates(users.filter((u) => u.id !== user.id)),
            ),
          );
        }

        await Promise.all(promises);
        setStep("reassign");
      } catch (err: any) {
        console.error("Failed to check active assignments:", err);
        setLoadError(err.response?.data?.message || "Failed to check active assignments");
        setStep("simple");
      }
    };

    loadAssignments();
  }, [isOpen, user, resetState]);

  if (!isOpen || !user) return null;

  const getFullName = (u: User | UserItem) => {
    const first = u.first_name || "";
    const last = u.last_name || "";
    return `${first} ${last}`.trim() || (u.email ?? "Unknown");
  };

  const isCurrentlyActive = !user.is_disabled;

  const roleLabel = (user.roles || [])
    .map((r: string) => {
      const map: Record<string, string> = { admin: "Admin", evaluator: "Evaluator", rnd: "R&D Staff", proponent: "Proponent" };
      return map[r] || r;
    })
    .join(", ");

  const isConfirmed = confirmText.toLowerCase() === "confirm";

  // Check all assignments have a mapping
  const allRndMapped =
    !assignments ||
    assignments.rnd_assignments.every((a) => rndMappings[a.proposal_id]);
  const allEvalMapped =
    !assignments ||
    assignments.evaluator_assignments.every((a) => evaluatorMappings[a.proposal_id]);
  const allMapped = allRndMapped && allEvalMapped;

  const canSubmit = step === "reassign" ? isConfirmed && allMapped : isConfirmed;

  const handleBulkRndChange = (newRndId: string) => {
    setBulkRnd(newRndId);
    if (!assignments || !newRndId) return;
    const mappings: Record<number, string> = {};
    assignments.rnd_assignments.forEach((a) => {
      mappings[a.proposal_id] = newRndId;
    });
    setRndMappings(mappings);
  };

  const handleBulkEvaluatorChange = (newEvalId: string) => {
    setBulkEvaluator(newEvalId);
    if (!assignments || !newEvalId) return;
    const mappings: Record<number, string> = {};
    assignments.evaluator_assignments.forEach((a) => {
      mappings[a.proposal_id] = newEvalId;
    });
    setEvaluatorMappings(mappings);
  };

  const handleConfirm = () => {
    if (step === "reassign" && assignments) {
      const reassignments: ReassignmentPayload = {
        rnd: assignments.rnd_assignments.map((a) => ({
          proposal_id: a.proposal_id,
          new_rnd_id: rndMappings[a.proposal_id],
        })),
        evaluator: assignments.evaluator_assignments.map((a) => ({
          proposal_id: a.proposal_id,
          new_evaluator_id: evaluatorMappings[a.proposal_id],
        })),
      };
      onConfirm(reassignments);
    } else {
      onConfirm();
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const totalAssignments =
    (assignments?.rnd_assignments.length || 0) + (assignments?.evaluator_assignments.length || 0);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 ${
          step === "reassign" ? "max-w-2xl max-h-[85vh]" : "max-w-md"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Power className="w-6 h-6 text-[#C8102E]" />
              {isCurrentlyActive ? "Disable User Account" : "Enable User Account"}
            </h3>
            {step === "reassign" && (
              <p className="text-sm text-slate-500 mt-1">
                Reassign {totalAssignments} active proposal{totalAssignments !== 1 ? "s" : ""} before disabling
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Loading state Skeleton */}
          {step === "loading" ? (
            <div className="space-y-6 animate-pulse">
              {/* User info skeleton */}
              <div className="flex items-center gap-3">
                <SkeletonPulse className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-5 w-32" />
                  <SkeletonPulse className="h-4 w-48 opacity-60" />
                  <SkeletonPulse className="h-3 w-24 opacity-40" />
                </div>
              </div>
              
              {/* Assignments skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <SkeletonPulse className="w-5 h-5 rounded-full" />
                  <SkeletonPulse className="h-4 w-full" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <SkeletonPulse className="w-4 h-4 rounded" />
                    <SkeletonPulse className="h-4 w-40" />
                  </div>
                  {[1].map(i => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <SkeletonPulse className="h-4 w-1/2" />
                        <SkeletonPulse className="h-5 w-20 rounded-full opacity-60" />
                      </div>
                      <SkeletonPulse className="h-9 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation input skeleton */}
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <SkeletonPulse className="h-4 w-32" />
                  <SkeletonPulse className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* User info */}
              <div className="flex items-center gap-3">
                <SecureImage
                  src={user.photo_profile_url ?? undefined}
                  fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(user))}&background=C8102E&color=fff&size=128`}
                  alt={getFullName(user)}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-800 truncate">{getFullName(user)}</h4>
                  <p className="text-sm text-slate-500 truncate">{user.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{roleLabel}</p>
                </div>
              </div>

              {/* Load error */}
              {loadError && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                  {loadError}. You can still proceed with disabling the account.
                </div>
              )}

              {/* Simple confirmation (no assignments or enabling) */}
              {step === "simple" && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to{" "}
                  <span className="font-semibold text-slate-800">
                    {isCurrentlyActive ? "disable" : "enable"}
                  </span>{" "}
                  this account?
                  {isCurrentlyActive
                    ? " The user will no longer be able to access the system."
                    : " The user will regain access to the system."}
                </p>
              )}

              {/* Reassignment step */}
              {step === "reassign" && assignments && (
                <div className="space-y-5">
                  {/* Warning banner */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                      This user has <strong>{totalAssignments}</strong> active proposal
                      {totalAssignments !== 1 ? "s" : ""}. You must reassign all proposals to other
                      users before disabling this account.
                    </p>
                  </div>

              {/* RND Assignments */}
              {assignments.rnd_assignments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-700">
                      R&D Assignments ({assignments.rnd_assignments.length})
                    </h4>
                  </div>

                  {/* Bulk assign */}
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">
                      Assign all to one R&D staff:
                    </label>
                    <div className="relative">
                      <select
                        value={bulkRnd}
                        onChange={(e) => handleBulkRndChange(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none pr-8"
                      >
                        <option value="">-- Select R&D Staff --</option>
                        {rndCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {getFullName(c)}
                            {c.departments?.[0]?.name ? ` (${c.departments[0].name})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Per-proposal assignments */}
                  <div className="space-y-2">
                    {assignments.rnd_assignments.map((a) => (
                      <div
                        key={`rnd-${a.proposal_id}`}
                        className="p-3 bg-white border border-slate-200 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate flex-1">
                            {a.project_title}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              STATUS_COLORS[a.proposal_status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {STATUS_LABELS[a.proposal_status] || a.proposal_status}
                          </span>
                        </div>
                        <div className="relative">
                          <select
                            value={rndMappings[a.proposal_id] || ""}
                            onChange={(e) =>
                              setRndMappings((prev) => ({
                                ...prev,
                                [a.proposal_id]: e.target.value,
                              }))
                            }
                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 appearance-none pr-8 ${
                              rndMappings[a.proposal_id]
                                ? "border-green-300 bg-green-50/30"
                                : "border-slate-300"
                            }`}
                          >
                            <option value="">-- Select replacement R&D --</option>
                            {rndCandidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {getFullName(c)}
                                {c.departments?.[0]?.name ? ` (${c.departments[0].name})` : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluator Assignments */}
              {assignments.evaluator_assignments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-700">
                      Evaluator Assignments ({assignments.evaluator_assignments.length})
                    </h4>
                  </div>

                  {/* Bulk assign */}
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <label className="block text-xs font-medium text-amber-700 mb-1.5">
                      Assign all to one evaluator:
                    </label>
                    <div className="relative">
                      <select
                        value={bulkEvaluator}
                        onChange={(e) => handleBulkEvaluatorChange(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none pr-8"
                      >
                        <option value="">-- Select Evaluator --</option>
                        {evaluatorCandidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {getFullName(c)}
                            {c.departments?.[0]?.name ? ` (${c.departments[0].name})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Per-proposal assignments */}
                  <div className="space-y-2">
                    {assignments.evaluator_assignments.map((a) => (
                      <div
                        key={`eval-${a.proposal_id}`}
                        className="p-3 bg-white border border-slate-200 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 truncate flex-1">
                            {a.project_title}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              STATUS_COLORS[a.evaluator_status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {STATUS_LABELS[a.evaluator_status] || a.evaluator_status}
                          </span>
                        </div>
                        <div className="relative">
                          <select
                            value={evaluatorMappings[a.proposal_id] || ""}
                            onChange={(e) =>
                              setEvaluatorMappings((prev) => ({
                                ...prev,
                                [a.proposal_id]: e.target.value,
                              }))
                            }
                            className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 appearance-none pr-8 ${
                              evaluatorMappings[a.proposal_id]
                                ? "border-green-300 bg-green-50/30"
                                : "border-slate-300"
                            }`}
                          >
                            <option value="">-- Select replacement evaluator --</option>
                            {evaluatorCandidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {getFullName(c)}
                                {c.departments?.[0]?.name ? ` (${c.departments[0].name})` : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirmation input — shown for simple and reassign steps */}
          {(step === "simple" || step === "reassign") && (
            <div>
              {step === "reassign" && !allMapped && (
                <p className="text-xs text-red-500 mb-2">
                  All proposals must have a replacement assigned before you can proceed.
                </p>
              )}
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Type{" "}
                <span className="font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  confirm
                </span>{" "}
                to proceed
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type confirm here..."
                className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 shadow-sm ${
                  isConfirmed
                    ? "border-green-400 focus:ring-green-300 bg-green-50/30"
                    : "border-slate-300 focus:ring-[#C8102E]/30 bg-white"
                }`}
              />
            </div>
          )}
        </>
      )}
    </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !canSubmit}
            className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg shadow-lg transition-all transform hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none ${
              isCurrentlyActive
                ? "bg-[#C8102E] hover:bg-[#A00D26] shadow-red-200"
                : "bg-green-700 hover:bg-green-800 shadow-green-200"
            }`}
          >
            <Power className="w-4 h-4" />
            {isSubmitting
              ? "Processing..."
              : isCurrentlyActive
                ? step === "reassign"
                  ? "Reassign & Disable"
                  : "Disable Account"
                : "Enable Account"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DisableAccountModal;
