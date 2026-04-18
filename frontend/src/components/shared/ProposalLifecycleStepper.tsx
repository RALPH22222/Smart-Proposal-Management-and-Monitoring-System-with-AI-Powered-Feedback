import { Check, X, RotateCcw, Circle } from "lucide-react";

// Compact horizontal stepper showing a proposal's position in the
// five-stage lifecycle. Used on the proponent proposal cards so the
// current stage is visible without opening the detail modal.
//
// Stages:
//   1. Submitted        — always reached once the proposal exists
//   2. R&D Review       — statuses review_rnd / revision_rnd
//   3. Evaluators       — under_evaluation
//   4. Endorsed         — endorsed_for_funding (also revision_funding,
//                         rejected_funding — proposal made it past R&D)
//   5. Funded           — funded
//
// Terminal failures (rejected_rnd, rejected_funding) render the stage
// where the proposal stopped in red.
// A revision (revision_rnd, revision_funding) pulses amber on its stage.

const STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "rnd", label: "R&D Review" },
  { key: "evaluators", label: "Evaluators" },
  { key: "endorsed", label: "Endorsed" },
  { key: "funded", label: "Funded" },
] as const;

type StepState = "done" | "current" | "pending" | "failed" | "revision";

function classifyStages(rawStatus: string): Record<string, StepState> {
  const s = (rawStatus || "").toLowerCase();
  const done = (keys: string[]) =>
    Object.fromEntries(STAGES.map((st) => [st.key, keys.includes(st.key) ? "done" : "pending"])) as Record<
      string,
      StepState
    >;
  const mark = (base: Record<string, StepState>, key: string, state: StepState): Record<string, StepState> => ({
    ...base,
    [key]: state,
  });

  switch (s) {
    case "pending":
    case "not_submitted":
      return mark(done([]), "submitted", "current");
    case "review_rnd":
    case "under_rnd_review":
      return mark(done(["submitted"]), "rnd", "current");
    case "revision_rnd":
    case "revise":
    case "revision":
      return mark(done(["submitted"]), "rnd", "revision");
    case "rejected_rnd":
      return mark(done(["submitted"]), "rnd", "failed");
    case "revised_proposal":
      // Proponent has just resubmitted — back in R&D intake.
      return mark(done(["submitted"]), "rnd", "current");
    case "under_evaluation":
    case "under_evaluator_assessment":
      return mark(done(["submitted", "rnd"]), "evaluators", "current");
    case "endorsed_for_funding":
      return mark(done(["submitted", "rnd", "evaluators"]), "endorsed", "current");
    case "revision_funding":
      return mark(done(["submitted", "rnd", "evaluators"]), "endorsed", "revision");
    case "rejected_funding":
      return mark(done(["submitted", "rnd", "evaluators"]), "endorsed", "failed");
    case "funded":
      return done(["submitted", "rnd", "evaluators", "endorsed", "funded"]);
    default:
      return mark(done([]), "submitted", "current");
  }
}

const STATE_COLORS: Record<
  StepState,
  { node: string; border: string; label: string; connector: string }
> = {
  done: {
    node: "bg-emerald-500 text-white",
    border: "border-emerald-500",
    label: "text-emerald-700",
    connector: "bg-emerald-500",
  },
  current: {
    node: "bg-[#C8102E] text-white ring-4 ring-[#C8102E]/15 animate-pulse",
    border: "border-[#C8102E]",
    label: "text-[#C8102E]",
    connector: "bg-slate-200",
  },
  revision: {
    node: "bg-amber-500 text-white ring-4 ring-amber-300/30 animate-pulse",
    border: "border-amber-500",
    label: "text-amber-700",
    connector: "bg-slate-200",
  },
  failed: {
    node: "bg-rose-500 text-white",
    border: "border-rose-500",
    label: "text-rose-700",
    connector: "bg-slate-200",
  },
  pending: {
    node: "bg-white text-slate-400",
    border: "border-slate-300",
    label: "text-slate-400",
    connector: "bg-slate-200",
  },
};

function StepIcon({ state, index }: { state: StepState; index: number }) {
  if (state === "done") return <Check className="w-3 h-3" />;
  if (state === "failed") return <X className="w-3 h-3" />;
  if (state === "revision") return <RotateCcw className="w-3 h-3" />;
  if (state === "current") return <Circle className="w-2 h-2 fill-current" />;
  return <span className="text-[10px] font-bold">{index + 1}</span>;
}

interface Props {
  /** Raw backend status string, e.g. "review_rnd", "funded". */
  rawStatus: string;
  /** Hide the stage labels (compact mode for dense cards). */
  hideLabels?: boolean;
}

export default function ProposalLifecycleStepper({ rawStatus, hideLabels = false }: Props) {
  const states = classifyStages(rawStatus);

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="flex">
        {STAGES.map((stage, idx) => {
          const state = states[stage.key];
          const colors = STATE_COLORS[state];
          const isLast = idx === STAGES.length - 1;
          // Connector after this step inherits the "done" color only when
          // this step is done (otherwise it's still pending).
          const connectorBorder = state === "done" ? "border-emerald-400" : "border-slate-200";

          return (
            <div key={stage.key} className="flex flex-col flex-1 last:flex-none">
              <div className="flex items-center">
                <div
                  className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${colors.node} ${colors.border}`}
                  title={`${stage.label}: ${state}`}
                  aria-label={`${stage.label}: ${state}`}
                >
                  <StepIcon state={state} index={idx} />
                </div>
                {!isLast && <div className={`border-t flex-1 mx-2 ${connectorBorder}`} />}
              </div>
              {!hideLabels && (
                <div className="w-6 flex justify-center mt-1">
                  <span className={`text-[9px] font-medium whitespace-nowrap ${colors.label}`}>
                    {stage.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
