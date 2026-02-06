import React, { useState, useEffect } from "react";
import {
  Clock,
  Edit2,
  User,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Tag,
} from "lucide-react";
import Swal from "sweetalert2";

import RnDEvaluatorPageModal from "../../../components/rnd-component/RnDEvaluatorPageModal";
import type { EvaluatorOption } from "../../../components/rnd-component/RnDEvaluatorPageModal";
import { getAssignmentTracker, handleExtensionRequest, getRndProposals } from "../../../services/proposal.api";

// --- INTERFACES ---

interface Assignment {
  id: string; // unique ID for key
  proposalId: string;
  proposalIdNumeric: number;
  proposalTitle: string;
  evaluatorIds: string[];
  evaluatorNames: string[];
  department: string;
  deadline: string;
  status:
    | "Pending"
    | "Accepts"
    | "Completed"
    | "Overdue"
    | "Rejected"
    | "Extension Requested"
    | "Extension Approved"
    | "Extension Rejected";
  projectType: string;
}

// Grouping structure to handle multiple evaluators per proposal
interface GroupedAssignment {
  proposalIdNumeric: number;
  proposalTitle: string;
  projectType: string;
  deadline: string;
  evaluators: {
    id: string; // evaluator ID
    name: string;
    department: string;
    status: string;
    deadline: number;
    request_deadline_at?: number | null; // For extension
    remarks?: string | null;
  }[];
}

export const RnDEvaluatorPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Edit Assignment Modal States
  const [showModal, setShowModal] = useState(false);
  const [currentEvaluators, setCurrentEvaluators] = useState<EvaluatorOption[]>([]);
  const [selectedProposalTitle, setSelectedProposalTitle] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all proposals visible to R&D
      const proposals = await getRndProposals();

      // 2. For each proposal, fetch its assignment tracker data
      const trackerPromises = proposals.map((p: any) => getAssignmentTracker(p.id));
      const trackerResults = await Promise.all(trackerPromises);

      // Flat list of all assignments
      const allAssignments = trackerResults.flat();
      console.log("Aggregated Assignment Data:", allAssignments);

      // Group by Proposal
      const groupedMap = new Map<number, GroupedAssignment>();

      allAssignments.forEach((item: any) => {
        // Robust check for missing relations
        if (!item || !item.proposal_id || !item.evaluator_id) {
          return;
        }

        const pid = item.proposal_id.id;
        // Additional safety: ensure pid exists
        if (!pid) return;

        if (!groupedMap.has(pid)) {
          groupedMap.set(pid, {
            proposalIdNumeric: pid,
            proposalTitle: item.proposal_id.project_title || "Untitled Proposal",
            projectType: item.proposal_id.sector?.name || "N/A",
            deadline: item.deadline ? new Date(item.deadline).toISOString() : new Date().toISOString(),
            evaluators: [],
          });
        }

        const group = groupedMap.get(pid)!;

        // Normalize status: If 'pending' but has a request_deadline_at, it's an extension request
        let effectiveStatus = item.status;
        if (item.status === "pending" && item.request_deadline_at) {
          effectiveStatus = "extension_requested";
        }

        // Safe Evaluator Data Extraction
        const evalId = item.evaluator_id.id || "unknown";
        const evalFirstName = item.evaluator_id.first_name || "Unknown";
        const evalLastName = item.evaluator_id.last_name || "";
        const evalName = `${evalFirstName} ${evalLastName}`.trim();
        const evalDept = item.evaluator_id.department_id?.name || "N/A";

        group.evaluators.push({
          id: evalId,
          name: evalName,
          department: evalDept,
          status: effectiveStatus, // extend, pending, accept, decline, completed
          deadline: item.deadline ? item.deadline : Date.now(),
          request_deadline_at: item.request_deadline_at,
          remarks: item.remarks,
        });
      });

      // Convert Grouped Data to Display 'Assignment' Interface
      const mappedAssignments: Assignment[] = Array.from(groupedMap.values()).map((group) => {
        // Determine aggregate status
        // If ANY evaluator requested extension, show 'Extension Requested' for visibility
        // Else find dominant status

        let aggregateStatus: Assignment["status"] = "Pending";
        const statusSet = new Set(group.evaluators.map((e) => e.status));

        if (statusSet.has("extend") || statusSet.has("extension_requested")) {
          aggregateStatus = "Extension Requested";
        } else if (statusSet.has("extension_approved")) {
          aggregateStatus = "Extension Approved";
        } else if (statusSet.has("extension_rejected")) {
          aggregateStatus = "Extension Rejected";
        } else if (statusSet.has("pending")) {
          aggregateStatus = "Pending";
        } else if (statusSet.has("completed") || statusSet.has("done")) {
          // If all completed?
          if (group.evaluators.every((e) => e.status === "completed")) aggregateStatus = "Completed";
          else aggregateStatus = "Pending"; // Mixed
        } else if (statusSet.has("accept") || statusSet.has("accepted")) {
          aggregateStatus = "Accepts";
        }

        // Check overdue (simple check against today)
        const now = new Date().getTime();
        if (aggregateStatus !== "Completed" && aggregateStatus !== "Extension Requested") {
          // Check if any deadline passed
          const anyOverdue = group.evaluators.some((e) => e.deadline < now);
          if (anyOverdue) aggregateStatus = "Overdue";
        }

        return {
          id: String(group.proposalIdNumeric),
          proposalIdNumeric: group.proposalIdNumeric,
          proposalId: `PRO-${group.proposalIdNumeric}`,
          proposalTitle: group.proposalTitle,
          evaluatorIds: group.evaluators.map((e) => e.id),
          evaluatorNames: group.evaluators.map((e) => e.name),
          department: group.evaluators[0]?.department || "N/A", // Just take first for list view
          deadline: new Date(group.evaluators[0]?.deadline || Date.now()).toISOString(),
          status: aggregateStatus,
          projectType: group.projectType,
        };
      });

      setAssignments(mappedAssignments);
    } catch (error) {
      console.error("Failed to fetch assignment tracker:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTIONS ---

  const handleExtensionAction = async (evaluatorId: string, action: "Accept" | "Reject") => {
    if (!selectedProposalId) return;

    try {
      await handleExtensionRequest({
        proposal_id: selectedProposalId,
        evaluator_id: evaluatorId,
        action: action === "Accept" ? "approved" : "denied",
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Extension request ${action === "Accept" ? "approved" : "rejected"} successfully.`,
      });

      // Refresh Data
      await fetchData();

      // Update Modal State Locally to reflect change immediately without closing
      setCurrentEvaluators((prev) =>
        prev.map((ev) => {
          if (ev.id === evaluatorId) {
            return {
              ...ev,
              // Update status for UI feedback
              status: action === "Accept" ? "Extension Approved" : "Extension Rejected", // Or map back to 'Pending' if approved means new deadline set
              extensionReason: undefined, // Clear request UI
            };
          }
          return ev;
        }),
      );

      // Close modal after short delay or keep open?
      // Best to close to refresh full main view state consistency
      setShowModal(false);
    } catch (error: any) {
      console.error("Extension Action Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to process extension request.",
      });
    }
  };

  const handleEdit = async (id: string) => {
    // When clicking 'Action' on a proposal row
    // We need to fetch/prepare the detailed evaluators list for that proposal
    // We can rely on the raw data we already fetched if we stored it properly,
    // or re-fetch. Since we grouped it earlier, let's look at the mapping logic or re-find in 'assignments'
    // But 'assignments' is simplified.
    // Better strategy: re-fetch or keep raw data.
    // For simplicity, let's filter from the 'assignments' state logic re-applied or just re-run the finding logic.
    // Actually, distinct evaluators details (remarks, request_deadline) are lost in 'assignments' map.
    // Let's re-fetch specifically or just use the tracker again.

    // Quick fix: Let's fetch the tracker again to be sure we have latest status details for the modal
    // OR, simpler: filter the last API response. But we didn't save it.
    // Let's modify fetchAssignments to save raw data or just accept a re-fetch pattern for now to rely on single source of truth.
    // Re-fetching full list might be heavy. Let's optimize by saving raw data in a ref or state if needed.
    // For now, let's just trigger a fresh fetch inside the modal logic or just allow the use of 'assignments' if we enrich it.

    // Let's enrich 'assignments' or use a separate fetch.
    // To save time/code churn, I'll just re-call the API since it's cleaner than modifying the main state structure heavily.
    setLoading(true);
    try {
      const proposalIdNumeric = parseInt(id);
      const data = await getAssignmentTracker(proposalIdNumeric);

      const relevantItems = data; // Data is already filtered by API now!

      if (relevantItems.length === 0) return;

      const modalEvaluators: EvaluatorOption[] = relevantItems.map((item) => {
        let status: EvaluatorOption["status"] = "Pending";
        let extensionDate = undefined;
        let extensionReason = undefined;

        // Map backend status to UI status
        // Backend: pending, accept, decline, extend (or extension_requested), completed

        // Check for implicit extension request first
        const isExtensionRequest =
          item.status === "extend" ||
          item.status === "extension_requested" ||
          (item.status === "pending" && item.request_deadline_at);

        if (isExtensionRequest) {
          status = "Extension Requested";
          extensionDate = item.request_deadline_at ? new Date(item.request_deadline_at).toLocaleDateString() : "N/A";
          extensionReason = item.remarks || "No reason provided";
        } else if (item.status === "accept" || item.status === "accepted") {
          status = "Accepts";
        } else if (item.status === "decline" || item.status === "rejected") {
          status = "Rejected";
        } else if (item.status === "completed") {
          status = "Completed";
        }

        return {
          id: item.evaluator_id.id,
          name: `${item.evaluator_id.first_name} ${item.evaluator_id.last_name}`,
          department: item.evaluator_id.department_id?.name || "N/A",
          status: status,
          comment: item.remarks || "", // potential overlap with extension reason, but ok
          extensionDate,
          extensionReason,
        };
      });

      setSelectedProposalTitle(relevantItems[0].proposal_id.project_title);
      setSelectedProposalId(proposalIdNumeric);
      setCurrentEvaluators(modalEvaluators);
      setShowModal(true);
    } catch (e) {
      console.error("Failed to load details", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReassignEvaluators = (newEvaluators: EvaluatorOption[]) => {
    // Reassignment logic not fully requested in this prompt, placeholder
    console.log("Reassigned Evaluators behavior to be implemented if needed", newEvaluators);
    setShowModal(false);
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.evaluatorNames.join(", ").toLowerCase().includes(search.toLowerCase()) ||
      a.proposalTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case "ICT":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Healthcare":
        return "bg-pink-100 text-pink-700 border-pink-200";
      case "Agriculture":
        return "bg-green-100 text-green-700 border-green-200";
      case "Energy":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Public Safety":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-gradient-to-br p-6 from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                Evaluator Assignment Tracker
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Track evaluator assignments, deadlines, and proposal statuses across departments
              </p>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Total Evaluators</h4>
              <p className="text-2xl font-bold text-purple-700">
                {new Set(assignments.flatMap((a) => a.evaluatorIds)).size}
              </p>
            </div>
            <div className="p-2 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Total Proposals</h4>
              <p className="text-2xl font-bold text-slate-800">{new Set(assignments.map((a) => a.proposalId)).size}</p>
            </div>
            <div className="p-2 rounded-xl">
              <FileText className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <section className="flex-shrink-0">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search evaluators or proposal titles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Accepts">Accepts</option>
                  <option value="Extension Requested">Extension Requested</option>
                  <option value="Extension Approved">Extension Approved</option>
                  <option value="Extension Rejected">Extension Rejected</option>
                  <option value="Completed">Completed</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Assignments List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C8102E]" />
              Evaluator Assignments
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
              </div>
            ) : (
              paginatedAssignments.map((assignment) => (
                <article
                  key={assignment.id}
                  className="p-4 hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-slate-800 mb-2">{assignment.proposalTitle}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3" />
                          <span>{assignment.evaluatorNames.join(", ")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                        </div>
                        {/* Project Type Badge */}
                        {assignment.projectType && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getProjectTypeColor(assignment.projectType)}`}
                          >
                            <Tag className="w-3 h-3" />
                            {assignment.projectType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(assignment.id)}
                        className="px-3 py-2 bg-[#C8102E] text-white rounded-lg hover:bg-[#A00E26] transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Action
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
            {!loading && paginatedAssignments.length === 0 && (
              <div className="p-8 text-center text-slate-500">No assignments found.</div>
            )}
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
              <span>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAssignments.length)} of{" "}
                {filteredAssignments.length} assignments
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3" /> Previous
                </button>
                <span className="px-3 py-1.5 text-xs font-medium text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* --- MERGED MODAL --- */}
      <RnDEvaluatorPageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentEvaluators={currentEvaluators}
        onReassign={handleReassignEvaluators}
        onExtensionAction={handleExtensionAction}
        proposalTitle={selectedProposalTitle}
      />
    </div>
  );
};

export default RnDEvaluatorPage;
