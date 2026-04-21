import type { EvaluatorOption } from "../components/rnd-component/RnDEvaluatorPageModal";
import type { AssignmentTrackerItem } from "../services/proposal.api";

export type AssignmentSummaryStatus = EvaluatorOption["status"] | "Overdue";
export type ExtensionReviewAction = "Accept" | "Reject";

type TrackerStatusLike = Pick<AssignmentTrackerItem, "status" | "request_deadline_at">;

function normalizeTrackerStatus({ status, request_deadline_at }: TrackerStatusLike): string {
  const rawStatus = String(status || "").toLowerCase();

  if (rawStatus === "extend" || rawStatus === "extension_requested") {
    return "extension_requested";
  }
  if (rawStatus === "pending" && request_deadline_at) {
    return "extension_requested";
  }
  if (rawStatus === "accept" || rawStatus === "accepted" || rawStatus === "accepts") {
    return "accept";
  }
  if (rawStatus === "decline" || rawStatus === "declined" || rawStatus === "reject" || rawStatus === "rejected") {
    return "rejected";
  }
  if (rawStatus === "completed" || rawStatus === "done") {
    return "completed";
  }
  if (rawStatus === "extension_approved") {
    return "extension_approved";
  }
  if (rawStatus === "extension_rejected" || rawStatus === "extension_denied") {
    return "extension_rejected";
  }
  return "pending";
}

export function getAssignmentDeadlineMs(deadline: AssignmentTrackerItem["deadline"] | undefined | null): number {
  if (!deadline) return Date.now();
  const ms = new Date(deadline).getTime();
  return Number.isFinite(ms) ? ms : Date.now();
}

export function getEvaluatorTrackerStatus(item: TrackerStatusLike): EvaluatorOption["status"] {
  const normalized = normalizeTrackerStatus(item);

  switch (normalized) {
    case "extension_requested":
      return "Extension Requested";
    case "accept":
      return "Accepts";
    case "rejected":
      return "Rejected";
    case "completed":
      return "Completed";
    case "extension_approved":
      return "Extension Approved";
    case "extension_rejected":
      return "Extension Rejected";
    default:
      return "Pending";
  }
}

export function getAssignmentAggregateStatus(
  evaluators: Array<{ status: EvaluatorOption["status"]; deadline: number }>,
): AssignmentSummaryStatus {
  const statuses = new Set(evaluators.map((e) => e.status));

  let aggregateStatus: AssignmentSummaryStatus = "Pending";
  if (statuses.has("Extension Requested")) {
    aggregateStatus = "Extension Requested";
  } else if (statuses.has("Extension Approved")) {
    aggregateStatus = "Extension Approved";
  } else if (statuses.has("Rejected")) {
    aggregateStatus = "Rejected";
  } else if (statuses.has("Pending")) {
    aggregateStatus = "Pending";
  } else if (statuses.has("Completed")) {
    aggregateStatus = evaluators.every((e) => e.status === "Completed") ? "Completed" : "Pending";
  } else if (statuses.has("Accepts")) {
    aggregateStatus = "Accepts";
  } else if (statuses.has("Extension Rejected")) {
    aggregateStatus = "Pending";
  }

  if (aggregateStatus !== "Completed" && aggregateStatus !== "Extension Requested") {
    const now = Date.now();
    if (evaluators.some((e) => e.deadline < now)) {
      return "Overdue";
    }
  }

  return aggregateStatus;
}

export function didExtensionActionPersist(
  items: AssignmentTrackerItem[],
  evaluatorId: string,
  action: ExtensionReviewAction,
): boolean {
  const item = items.find((entry) => entry?.evaluator_id?.id === evaluatorId);
  if (!item) return false;

  const normalized = normalizeTrackerStatus(item);
  if (action === "Accept") {
    return normalized === "accept" || normalized === "extension_approved";
  }

  return normalized === "pending" || normalized === "rejected" || normalized === "extension_rejected";
}
