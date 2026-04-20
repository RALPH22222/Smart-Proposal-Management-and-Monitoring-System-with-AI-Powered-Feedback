import { useState, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  getProposalRevisionContext,
  type RevisionContext,
  type RevisionContextBudgetVersion,
} from '../../services/proposal.api';
import { formatDate, formatDateTime } from '../../utils/date-formatter';
<<<<<<< Updated upstream
import { openSignedUrl } from '../../utils/signed-url';
=======
>>>>>>> Stashed changes
import SkeletonPulse from './SkeletonPulse';

interface ProposalRevisionContextProps {
  proposalId: number | string;
}

const CATEGORY_LABELS: Record<string, string> = {
  ps: 'Personnel Services (PS)',
  mooe: 'Maintenance & Other Operating Expenses (MOOE)',
  co: 'Capital Outlay (CO)',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export default function ProposalRevisionContext({ proposalId }: ProposalRevisionContextProps) {
  const [data, setData] = useState<RevisionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'revisions' | 'budget' | 'documents'>('revisions');
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(new Set());
  const [selectedBudgetPair, setSelectedBudgetPair] = useState<[number, number] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getProposalRevisionContext(proposalId)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          // Auto-select latest budget version pair
          if (result.budget_versions.length >= 2) {
            const len = result.budget_versions.length;
            setSelectedBudgetPair([len - 2, len - 1]);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load revision context');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [proposalId]);

  const toggleRevision = (id: number) => {
    setExpandedRevisions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {/* Fake Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg">
          <SkeletonPulse className="flex-1 h-8 rounded-md" />
          <SkeletonPulse className="flex-1 h-8 rounded-md" />
          <SkeletonPulse className="flex-1 h-8 rounded-md" />
        </div>
        
        {/* Fake Revision Requests */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SkeletonPulse className="w-6 h-6 rounded-full" />
                <div>
                  <SkeletonPulse className="h-4 w-32 mb-1.5" />
                  <SkeletonPulse className="h-3 w-48 opacity-60" />
                </div>
              </div>
              <SkeletonPulse className="w-4 h-4 rounded" />
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

  if (!data) return null;

  const hasRevisions = data.revision_summaries.length > 0;
  const hasBudgetVersions = data.budget_versions.length > 1;
  const hasMultipleVersions = data.versions.length > 1;

  if (!hasRevisions && !hasBudgetVersions && !hasMultipleVersions) {
    return (
      <div className="text-center py-8 text-slate-400">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No revisions found for this proposal</p>
      </div>
    );
  }

  const tabs = [
    { id: 'revisions' as const, label: 'Revision Requests', count: data.revision_summaries.length, icon: MessageSquare },
    { id: 'budget' as const, label: 'Budget Changes', count: Math.max(0, data.budget_versions.length - 1), icon: DollarSign },
    { id: 'documents' as const, label: 'Document Versions', count: data.versions.length, icon: FileText },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-[#C8102E] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Revision Requests Tab */}
      {activeTab === 'revisions' && (
        <div className="space-y-3">
          {data.revision_summaries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No revision requests found</p>
          ) : (
            data.revision_summaries.map((rev, index) => {
              const isExpanded = expandedRevisions.has(rev.id);
              return (
                <div key={rev.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleRevision(rev.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          Revision Request #{index + 1}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{rev.rnd_name}</span>
                          <Clock className="w-3 h-3 ml-1" />
                          <span>{formatDate(rev.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-slate-100">
                      <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                        <p className="text-xs font-semibold text-amber-800 mb-1">R&D Remarks:</p>
                        <p className="text-xs text-amber-700 whitespace-pre-wrap">{rev.remarks || 'No remarks provided'}</p>
                      </div>
                      {rev.included_evaluator_ids && rev.included_evaluator_ids.length > 0 && (
                        <p className="text-[10px] text-slate-400">
                          Includes feedback from {rev.included_evaluator_ids.length} evaluator(s)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Budget Changes Tab */}
      {activeTab === 'budget' && (
        <div>
          {data.budget_versions.length <= 1 ? (
            <p className="text-sm text-slate-400 text-center py-6">No budget changes to compare</p>
          ) : (
            <>
              {/* Version selector */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="text-slate-500 font-medium">Compare:</span>
                <select
                  className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
                  value={selectedBudgetPair ? selectedBudgetPair[0] : ''}
                  onChange={(e) => {
                    const from = Number(e.target.value);
                    const to = selectedBudgetPair ? selectedBudgetPair[1] : data.budget_versions.length - 1;
                    setSelectedBudgetPair([from, to > from ? to : from + 1]);
                  }}
                >
                  {data.budget_versions.slice(0, -1).map((v, i) => (
                    <option key={v.id} value={i}>v{v.version_number} ({formatDate(v.created_at)})</option>
                  ))}
                </select>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <select
                  className="border border-slate-200 rounded-md px-2 py-1 text-xs bg-white"
                  value={selectedBudgetPair ? selectedBudgetPair[1] : ''}
                  onChange={(e) => {
                    const to = Number(e.target.value);
                    const from = selectedBudgetPair ? selectedBudgetPair[0] : 0;
                    setSelectedBudgetPair([from < to ? from : to - 1, to]);
                  }}
                >
                  {data.budget_versions.slice(1).map((v, i) => (
                    <option key={v.id} value={i + 1}>v{v.version_number} ({formatDate(v.created_at)})</option>
                  ))}
                </select>
              </div>

              {/* Budget diff table */}
              {selectedBudgetPair && (
                <BudgetVersionDiff
                  from={data.budget_versions[selectedBudgetPair[0]]}
                  to={data.budget_versions[selectedBudgetPair[1]]}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Document Versions Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-2">
          {data.versions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No document versions found</p>
          ) : (
            data.versions.map((version, index) => {
              const fileUrls = Array.isArray(version.file_url) ? version.file_url : [version.file_url];
              return (
                <div key={version.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    index === data.versions.length - 1
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    v{index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {index === 0 ? 'Original Submission' : `Revision ${index}`}
                      {index === data.versions.length - 1 && (
                        <span className="ml-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Current</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDateTime(version.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {fileUrls.map((url, fi) => (
                      // Must go through openSignedUrl — raw S3 links return AccessDenied
                      // because the bucket is private. openSignedUrl swaps the URL for a
                      // presigned one and also routes .doc/.docx through the Office viewer.
                      <button
                        key={fi}
                        type="button"
                        onClick={() => url && openSignedUrl(url)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {fileUrls.length > 1 ? `File ${fi + 1}` : 'View'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Inline Budget Diff ───────────────────────────────────────────────────────

interface BudgetVersionDiffProps {
  from: RevisionContextBudgetVersion;
  to: RevisionContextBudgetVersion;
}

type DiffStatus = 'unchanged' | 'modified' | 'added' | 'removed';

function BudgetVersionDiff({ from, to }: BudgetVersionDiffProps) {
  const makeKey = (item: { category: string; item_name: string; spec: string | null }) =>
    `${item.category}::${item.item_name}::${item.spec || ''}`;

  const fromMap = new Map(from.proposal_budget_items.map(i => [makeKey(i), i]));
  const toMap = new Map(to.proposal_budget_items.map(i => [makeKey(i), i]));

  const allKeys = new Set([...fromMap.keys(), ...toMap.keys()]);

  const rows: { status: DiffStatus; category: string; itemName: string; fromAmount: number; toAmount: number }[] = [];

  allKeys.forEach(key => {
    const f = fromMap.get(key);
    const t = toMap.get(key);

    if (f && t) {
      const changed = f.total_amount !== t.total_amount || f.quantity !== t.quantity || f.unit_price !== t.unit_price;
      rows.push({
        status: changed ? 'modified' : 'unchanged',
        category: t.category,
        itemName: t.item_name,
        fromAmount: f.total_amount,
        toAmount: t.total_amount,
      });
    } else if (f && !t) {
      rows.push({ status: 'removed', category: f.category, itemName: f.item_name, fromAmount: f.total_amount, toAmount: 0 });
    } else if (!f && t) {
      rows.push({ status: 'added', category: t.category, itemName: t.item_name, fromAmount: 0, toAmount: t.total_amount });
    }
  });

  // Group by category
  const categories = ['ps', 'mooe', 'co'];

  const statusColors: Record<DiffStatus, string> = {
    unchanged: '',
    modified: 'bg-amber-50',
    added: 'bg-emerald-50',
    removed: 'bg-red-50',
  };

  const statusBadge: Record<DiffStatus, { label: string; color: string } | null> = {
    unchanged: null,
    modified: { label: 'Changed', color: 'text-amber-600 bg-amber-100' },
    added: { label: 'New', color: 'text-emerald-600 bg-emerald-100' },
    removed: { label: 'Removed', color: 'text-red-600 bg-red-100' },
  };

  const grandTotalDiff = to.grand_total - from.grand_total;

  return (
    <div className="space-y-3">
      {/* Grand total summary */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
        <span className="text-xs font-medium text-slate-600">Grand Total Change</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{formatCurrency(from.grand_total)}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-bold text-slate-800">{formatCurrency(to.grand_total)}</span>
          {grandTotalDiff !== 0 && (
            <span className={`text-[10px] font-bold ${grandTotalDiff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              ({grandTotalDiff > 0 ? '+' : ''}{formatCurrency(grandTotalDiff)})
            </span>
          )}
        </div>
      </div>

      {/* Per-category tables */}
      {categories.map(cat => {
        const catRows = rows.filter(r => r.category === cat);
        if (catRows.length === 0) return null;

        return (
          <div key={cat} className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
              <h5 className="text-xs font-semibold text-slate-700">{CATEGORY_LABELS[cat] || cat.toUpperCase()}</h5>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-3 py-1.5 text-slate-500 font-medium">Item</th>
                  <th className="text-right px-3 py-1.5 text-slate-500 font-medium w-24">Before</th>
                  <th className="text-right px-3 py-1.5 text-slate-500 font-medium w-24">After</th>
                  <th className="text-right px-3 py-1.5 text-slate-500 font-medium w-16">Status</th>
                </tr>
              </thead>
              <tbody>
                {catRows.map((row, i) => {
                  const badge = statusBadge[row.status];
                  return (
                    <tr key={i} className={`${statusColors[row.status]} border-b border-slate-50 last:border-0`}>
                      <td className="px-3 py-2 text-slate-700">{row.itemName}</td>
                      <td className={`px-3 py-2 text-right ${row.status === 'removed' ? 'line-through text-red-400' : 'text-slate-600'}`}>
                        {row.fromAmount > 0 ? formatCurrency(row.fromAmount) : '-'}
                      </td>
                      <td className={`px-3 py-2 text-right font-medium ${row.status === 'added' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {row.toAmount > 0 ? formatCurrency(row.toAmount) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {badge && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
