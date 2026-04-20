import {
  Lock,
  Banknote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Award,
} from 'lucide-react';

type StepStatus = 'locked' | 'fund_request' | 'due' | 'submitted' | 'approved' | 'overdue';

interface Step {
  label: string;
  status: StepStatus;
  yearNumber?: number; // Phase 2A — populated on quarter steps only (not Terminal/Certificate).
}

interface QuarterStepperProps {
  /**
   * One entry per applicable reporting period. Single-year projects pass the
   * four Q1–Q4 entries; multi-year projects pass `duration_years * 4` entries
   * and the stepper groups them into year clusters visually. The caller owns
   * the year_number on each quarter so the stepper doesn't have to re-derive it.
   */
  quarters: { status: string; quarterLabel: string; year_number?: number }[];
  terminalReportStatus?: string | null;
  certificateIssued?: boolean;
  currentIndex: number;
  onStepClick: (index: number) => void;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; icon: typeof Clock; iconColor: string }> = {
  approved:     { bg: 'bg-emerald-500', border: 'border-emerald-500', icon: CheckCircle2, iconColor: 'text-white' },
  submitted:    { bg: 'bg-blue-500',    border: 'border-blue-500',    icon: Send,         iconColor: 'text-white' },
  due:          { bg: 'bg-amber-400',   border: 'border-amber-400',   icon: Clock,        iconColor: 'text-white' },
  fund_request: { bg: 'bg-amber-400',   border: 'border-amber-400',   icon: Banknote,     iconColor: 'text-white' },
  overdue:      { bg: 'bg-red-500',     border: 'border-red-500',     icon: AlertTriangle, iconColor: 'text-white' },
  locked:       { bg: 'bg-slate-200',   border: 'border-slate-300',   icon: Lock,         iconColor: 'text-slate-400' },
  verified:     { bg: 'bg-emerald-500', border: 'border-emerald-500', icon: CheckCircle2, iconColor: 'text-white' },
  none:         { bg: 'bg-slate-200',   border: 'border-slate-300',   icon: FileText,     iconColor: 'text-slate-400' },
  certificate_done:    { bg: 'bg-emerald-500', border: 'border-emerald-500', icon: Award, iconColor: 'text-white' },
  certificate_pending: { bg: 'bg-slate-200',   border: 'border-slate-300',   icon: Award, iconColor: 'text-slate-400' },
};

function getLineColor(leftStatus: string): string {
  if (leftStatus === 'approved' || leftStatus === 'verified' || leftStatus === 'certificate_done') {
    return 'bg-emerald-400';
  }
  return 'bg-slate-200';
}

function isCompleted(status: string): boolean {
  return status === 'approved' || status === 'verified' || status === 'certificate_done';
}

export default function QuarterStepper({
  quarters,
  terminalReportStatus,
  certificateIssued,
  currentIndex,
  onStepClick,
}: QuarterStepperProps) {
  // Build quarter steps first — one node per reporting period. For multi-year
  // projects the stepper groups nodes visually by year (Y1 block, thin separator,
  // Y2 block, etc.). Single-year projects get the flat strip unchanged.
  const quarterSteps: Step[] = quarters.map((q) => ({
    label: q.quarterLabel,
    status: q.status as StepStatus,
    yearNumber: q.year_number,
  }));
  const quarterCount = quarters.length;
  const isMultiYear = quarters.some((q) => (q.year_number ?? 1) > 1);

  // Terminal report step — unlocks once every applicable period is approved.
  const allQuartersApproved = quarterCount > 0 && quarters.every((q) => q.status === 'approved');
  let termStatus: string = 'locked';
  if (terminalReportStatus === 'verified') termStatus = 'verified';
  else if (terminalReportStatus === 'submitted') termStatus = 'submitted';
  else if (allQuartersApproved) termStatus = 'due';

  // Certificate step
  let certStatus: string = 'locked';
  if (certificateIssued) certStatus = 'certificate_done';
  else if (termStatus === 'verified') certStatus = 'due';

  const tailSteps: Step[] = [
    { label: 'Terminal', status: termStatus as StepStatus },
    { label: 'Certificate', status: certStatus as StepStatus },
  ];

  // Group consecutive quarter steps by year number so we can render a year header
  // above each cluster. Single-year projects produce one group with no header.
  type YearGroup = { yearNumber: number; steps: Step[]; startIdx: number };
  const yearGroups: YearGroup[] = [];
  quarterSteps.forEach((step, idx) => {
    const yr = step.yearNumber ?? 1;
    const last = yearGroups[yearGroups.length - 1];
    if (last && last.yearNumber === yr) {
      last.steps.push(step);
    } else {
      yearGroups.push({ yearNumber: yr, steps: [step], startIdx: idx });
    }
  });

  return (
    <div className="hidden lg:flex flex-col w-full px-2 mb-4">
      <div className="flex items-start w-full gap-2">
        {yearGroups.map((group, groupIdx) => (
          <div key={`year-${group.yearNumber}`} className="flex flex-col flex-1 min-w-0">
            {isMultiYear && (
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1 px-1">
                Year {group.yearNumber}
              </span>
            )}
            <div className="flex items-center">
              {group.steps.map((step, stepIdxInGroup) => {
                const idx = group.startIdx + stepIdxInGroup;
                const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.locked;
                const Icon = config.icon;
                const isActive = idx === currentIndex;
                const isClickable = true;
                const isLastInGroup = stepIdxInGroup === group.steps.length - 1;
                const isLastGroup = groupIdx === yearGroups.length - 1;

                return (
                  <div key={idx} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => isClickable && onStepClick(idx)}
                      className={`relative flex flex-col items-center gap-1 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                      title={`${step.label}: ${step.status.replace('_', ' ')}`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${config.bg} ${config.border} ${
                          isActive ? 'ring-2 ring-offset-2 ring-blue-400 scale-110' : ''
                        } ${isClickable && !isActive ? 'group-hover:scale-105' : ''}`}
                      >
                        <Icon className={`w-4 h-4 ${config.iconColor}`} />
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${
                        isActive ? 'text-blue-700' : isCompleted(step.status) ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </span>
                    </button>

                    {(!isLastInGroup || !isLastGroup) && (
                      <div className="flex-1 mx-1 mt-[-14px]">
                        <div className={`h-0.5 w-full rounded-full ${
                          isCompleted(step.status) ? getLineColor(step.status) : 'bg-slate-200'
                        } ${!isCompleted(step.status) ? 'border-t border-dashed border-slate-300 bg-transparent h-0' : ''}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Terminal + Certificate — always at the end, not grouped under a year. */}
        <div className="flex flex-col">
          {isMultiYear && (
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1 px-1 invisible">
              —
            </span>
          )}
          <div className="flex items-center">
            {tailSteps.map((step, idx) => {
              const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.locked;
              const Icon = config.icon;
              return (
                <div key={`tail-${idx}`} className="flex items-center">
                  <div className="relative flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${config.bg} ${config.border}`}
                      title={`${step.label}: ${step.status.replace('_', ' ')}`}
                    >
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${
                      isCompleted(step.status) ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < tailSteps.length - 1 && (
                    <div className="w-8 mx-1 mt-[-14px]">
                      <div className={`h-0.5 w-full rounded-full ${
                        isCompleted(step.status) ? getLineColor(step.status) : 'bg-slate-200'
                      } ${!isCompleted(step.status) ? 'border-t border-dashed border-slate-300 bg-transparent h-0' : ''}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
