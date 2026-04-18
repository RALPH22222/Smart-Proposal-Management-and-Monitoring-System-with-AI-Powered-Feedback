import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, GitCompareArrows } from 'lucide-react';
import ProposalTimeline from './ProposalTimeline';
import ProposalRevisionContext from './ProposalRevisionContext';

interface ProposalInsightsPanelProps {
  proposalId: number | string;
  proposalTitle?: string;
  /** If true, shows both Timeline and Revision tabs. If false, only shows Timeline. */
  showRevisions?: boolean;
}

/**
 * Renders two small icon buttons (Timeline + Revision History) that open a
 * slide-out panel with the relevant content. Designed to be dropped into any
 * proposal detail modal header area with minimal integration.
 */
export function ProposalInsightButtons({ proposalId, proposalTitle, showRevisions = true }: ProposalInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'timeline' | 'revisions'>('timeline');

  const openPanel = (view: 'timeline' | 'revisions') => {
    setActiveView(view);
    setIsOpen(true);
  };

  return (
    <>
      {/* Trigger buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => openPanel('timeline')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          title="View proposal timeline"
        >
          <Clock className="w-3.5 h-3.5" />
          Timeline
        </button>
        {showRevisions && (
          <button
            onClick={() => openPanel('revisions')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="View revision history"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            Revisions
          </button>
        )}
      </div>

      {/* Modal */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6" onClick={() => setIsOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Modal Container */}
          <div
            className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-800">
                  {activeView === 'timeline' ? 'Proposal Timeline' : 'Revision History'}
                </h2>
                {proposalTitle && (
                  <div className="overflow-hidden w-full max-w-[350px] mt-0.5" style={{ containerType: 'inline-size' }}>
                    <p className="text-xs text-slate-500 whitespace-nowrap inline-block animate-[scrollTitle_8s_ease-in-out_infinite]">
                      {proposalTitle}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 px-5 pt-3 pb-0">
              <button
                onClick={() => setActiveView('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
                  activeView === 'timeline'
                    ? 'bg-white text-[#C8102E] border border-b-0 border-slate-200 -mb-px relative z-10'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Timeline
              </button>
              {showRevisions && (
                <button
                  onClick={() => setActiveView('revisions')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors ${
                    activeView === 'revisions'
                      ? 'bg-white text-[#C8102E] border border-b-0 border-slate-200 -mb-px relative z-10'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <GitCompareArrows className="w-3.5 h-3.5" />
                  Revisions
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 border-t border-slate-200">
              {activeView === 'timeline' ? (
                <ProposalTimeline proposalId={proposalId} />
              ) : (
                <ProposalRevisionContext proposalId={proposalId} />
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Modal animation */}
      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-pop {
          animation: modal-pop 0.2s ease-out forwards;
        }
        @keyframes scrollTitle {
          0%, 15% { transform: translateX(0); }
          75%, 85% { transform: translateX(min(0px, calc(100cqw - 100%))); }
          95%, 100% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
