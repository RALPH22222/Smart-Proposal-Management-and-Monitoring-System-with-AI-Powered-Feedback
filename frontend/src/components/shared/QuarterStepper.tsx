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
}

interface QuarterStepperProps {
  quarters: { status: string; quarterLabel: string }[];
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
  // Build steps: Q1-Q4 + Terminal + Certificate
  const steps: Step[] = quarters.map((q) => ({
    label: q.quarterLabel,
    status: q.status as StepStatus,
  }));

  // Terminal report step
  const allQuartersApproved = quarters.length >= 4 && quarters.every((q) => q.status === 'approved');
  let termStatus: string = 'locked';
  if (terminalReportStatus === 'verified') termStatus = 'verified';
  else if (terminalReportStatus === 'submitted') termStatus = 'submitted';
  else if (allQuartersApproved) termStatus = 'due';

  steps.push({ label: 'Terminal', status: termStatus as StepStatus });

  // Certificate step
  let certStatus: string = 'locked';
  if (certificateIssued) certStatus = 'certificate_done';
  else if (termStatus === 'verified') certStatus = 'due';

  steps.push({ label: 'Certificate', status: certStatus as StepStatus });

  return (
    <div className="hidden lg:flex items-center justify-between w-full px-2 mb-4">
      {steps.map((step, idx) => {
        const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.locked;
        const Icon = config.icon;
        const isActive = idx === currentIndex && idx < 4; // Only Q1-Q4 are clickable
        const isClickable = idx < 4; // Quarters are navigable

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
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

            {/* Connector line (not after last node) */}
            {idx < steps.length - 1 && (
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
  );
}
