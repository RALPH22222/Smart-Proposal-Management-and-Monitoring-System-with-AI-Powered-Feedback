import { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  Send,
  UserCheck,
  CheckCircle,
  XCircle,
  RotateCcw,
  Gavel,
  DollarSign,
  Star,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { getProposalTimeline, type TimelineEvent } from '../../services/proposal.api';
import { formatDateTime } from '../../utils/date-formatter';
import SkeletonPulse from './SkeletonPulse';

// Map action names to human-readable labels and icons
const ACTION_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  proposal_created: { label: 'Proposal Created', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  proposal_forwarded_to_rnd: { label: 'Forwarded to R&D', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  proposal_auto_distributed: { label: 'Auto-Distributed to R&D', icon: Send, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  evaluator_assigned: { label: 'Evaluator Assigned', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-100' },
  evaluator_removed: { label: 'Evaluator Removed', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  evaluation_scores_submitted: { label: 'Evaluation Scores Submitted', icon: Star, color: 'text-amber-600', bg: 'bg-amber-100' },
  proposal_endorsed_for_funding: { label: 'Endorsed for Funding', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  proposal_funded: { label: 'Proposal Funded', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
  proposal_revision_requested: { label: 'Revision Requested', icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-100' },
  proposal_revision_submitted: { label: 'Revision Submitted', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  proposal_rejected: { label: 'Proposal Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  proposal_status_changed: { label: 'Status Changed', icon: RotateCcw, color: 'text-slate-600', bg: 'bg-slate-100' },
  decision_evaluator: { label: 'Evaluator Decision', icon: Gavel, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  proposal_rejection_funding: { label: 'Rejected at Funding', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  proposal_revision_funding: { label: 'Revision at Funding', icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-100' },
};

const getActionConfig = (action: string) => {
  return ACTION_CONFIG[action] || { label: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100' };
};

// Internal fields logged for audit purposes that should never be surfaced in the user-facing timeline
// (raw UUIDs, internal counters, load balancing metrics, etc).
const HIDDEN_DETAIL_KEYS = new Set([
  'rnd_id',
  'to_rnd_id',
  'from_rnd_id',
  'user_id',
  'evaluator_id',
  'proponent_id',
  'rnd_count',
  'rnd_load',
  'disabled_user_id',
  'new_rnd_id',
]);

const EVALUATOR_ACTOR_ACTIONS = new Set([
  'decision_evaluator',
  'evaluator_accepted',
  'evaluator_declined',
  'evaluator_extension_requested',
  'evaluation_scores_submitted',
]);

interface ProposalTimelineProps {
  proposalId: number | string;
  onClose?: () => void;
  anonymizeEvaluators?: boolean;
}

const getEvaluatorIdentifier = (event: TimelineEvent): string | null => {
  const evaluatorId = event.details?.evaluator_id;
  const evaluatorName = typeof event.details?.evaluator_name === 'string'
    ? event.details.evaluator_name.trim().toLowerCase()
    : '';
  const actorName = typeof event.actor === 'string' ? event.actor.trim().toLowerCase() : '';

  if (typeof evaluatorId === 'string' && evaluatorId.trim()) {
    return `id:${evaluatorId.trim()}`;
  }

  if (typeof evaluatorId === 'number') {
    return `id:${String(evaluatorId)}`;
  }

  if (evaluatorName) {
    return `name:${evaluatorName}`;
  }

  if (EVALUATOR_ACTOR_ACTIONS.has(event.action) && actorName) {
    return `actor:${actorName}`;
  }

  return null;
};

export default function ProposalTimeline({ proposalId, anonymizeEvaluators = false }: ProposalTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProposalTimeline(proposalId)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load timeline');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [proposalId]);

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const evaluatorAliases = new Map<string, string>();
  let evaluatorCount = 0;

  if (anonymizeEvaluators) {
    for (const event of events) {
      const identifier = getEvaluatorIdentifier(event);
      if (!identifier || evaluatorAliases.has(identifier)) continue;
      evaluatorCount += 1;
      evaluatorAliases.set(identifier, `Evaluator ${evaluatorCount}`);
    }
  }

  if (loading) {
    return (
      <div className="relative animate-pulse py-2">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100" />
        
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative flex items-start gap-3">
              <SkeletonPulse className="relative z-10 w-10 h-10 rounded-full flex-shrink-0 border-2 border-white shadow-sm" />
              <div className="flex-1 pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonPulse className="h-4 w-40" />
                  <SkeletonPulse className="h-3 w-16 opacity-60" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <SkeletonPulse className="h-3 w-24 opacity-60" />
                  <SkeletonPulse className="h-2 w-20 opacity-40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No timeline events found</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200" />

      <div className="space-y-0">
        {events.map((event, index) => {
          const config = getActionConfig(event.action);
          const Icon = config.icon;
          const evaluatorAlias = anonymizeEvaluators
            ? evaluatorAliases.get(getEvaluatorIdentifier(event) || '')
            : null;
          const displayActor = evaluatorAlias && EVALUATOR_ACTOR_ACTIONS.has(event.action)
            ? evaluatorAlias
            : event.actor;
          const visibleDetailEntries = event.details
            ? Object.entries(event.details).filter(
                ([key, value]) =>
                  value !== null &&
                  value !== undefined &&
                  !HIDDEN_DETAIL_KEYS.has(key),
              )
            : [];
          const hasDetails = visibleDetailEntries.length > 0;
          const isExpanded = expandedIds.has(event.id);
          const isFirst = index === 0;
          const isLast = index === events.length - 1;

          // Compute time since previous event
          let timeSince = '';
          if (index > 0) {
            const prev = new Date(events[index - 1].timestamp).getTime();
            const curr = new Date(event.timestamp).getTime();
            const diffMs = curr - prev;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) timeSince = `${diffMins}m later`;
            else if (diffMins < 1440) timeSince = `${Math.floor(diffMins / 60)}h later`;
            else timeSince = `${Math.floor(diffMins / 1440)}d later`;
          }

          return (
            <div key={event.id} className={`relative flex items-start gap-3 ${isFirst ? '' : 'pt-4'} ${isLast ? '' : 'pb-1'}`}>
              {/* Icon dot */}
              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} border-2 border-white shadow-sm`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div
                  className={`${hasDetails ? 'cursor-pointer' : ''} group`}
                  onClick={() => hasDetails && toggleExpanded(event.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {config.label}
                      </span>
                      {hasDetails && (
                        isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                    {timeSince && (
                      <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                        {timeSince}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{displayActor}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(event.timestamp)}</span>
                  </div>
                </div>

                {/* Expanded details */}
                {hasDetails && isExpanded && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                    {visibleDetailEntries.map(([key, value]) => {
                      const displayKey = key === 'evaluator_name'
                        ? 'Evaluator'
                        : key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                      const displayValue = key === 'evaluator_name' && evaluatorAlias
                        ? evaluatorAlias
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value);
                      return (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-slate-500 whitespace-nowrap">{displayKey}:</span>
                          <span className="text-slate-700 break-all">{displayValue}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
