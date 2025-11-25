import React from "react";
import { FaTimes, FaFileAlt, FaUser, FaCalendar, FaCheckCircle } from 'react-icons/fa';
import { RotateCcw, XCircle } from 'lucide-react';

type Project = {
  id: string;
  title: string;
  currentIndex: number;
  submissionDate: string;
  lastUpdated: string;
  budget: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
  evaluators: number;
};

interface CommentsModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  project,
  onClose
}) => {
  if (!isOpen || !project) return null;

  // Generate random status (Revise or Reject)
  const randomStatus = Math.random() > 0.5 ? 'Revise' : 'Reject';
  
  // Check if project is approved (last stage)
  const isProjectApproved = project.currentIndex === 4;
  
  // Generate random date within the last 30 days
  const randomDate = new Date();
  randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
  const evaluationDate = randomDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Rejection reasons (only for Reject status)
  const rejectionReasons = randomStatus === 'Reject' ? [
    "Project objectives do not align with current organizational priorities.",
    "Proposed methodology lacks sufficient detail and rigor.",
    "Budget allocation exceeds available funding limits.",
    "Timeline is unrealistic given project scope and resources.",
    "Insufficient evidence of project feasibility and impact."
  ][Math.floor(Math.random() * 5)] : '';

  const getDecisionColor = (status: string) => {
    switch (status) {
      case 'Revise':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Reject':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getDecisionIcon = (status: string) => {
    switch (status) {
      case 'Revise':
        return <RotateCcw className="w-5 h-5 text-amber-600" />;
      case 'Reject':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FaFileAlt className="w-4 h-4 text-slate-600" />;
    }
  };

  if (isProjectApproved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                <FaCheckCircle className="text-white text-lg" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">Project Approved</h4>
                <p className="text-xs text-slate-500">Congratulations!</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <FaTimes />
            </button>
          </div>

          <div className="text-center py-6">
            <FaCheckCircle className="text-emerald-500 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Project Successfully Approved</h3>
            <p className="text-slate-600 mb-4">
              Your project "<span className="font-semibold">{project.title}</span>" has been approved and is now ready for implementation.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-emerald-800 font-semibold">
                Your project is monetized by R&D.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button 
              onClick={onClose} 
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all duration-200 cursor-pointer text-sm font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10 max-h-[90vh] overflow-y-auto">
        {/* Header - Matching the provided design */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h4 className="text-xl font-bold text-slate-800">R&D Evaluation</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Complete assessment report for {project.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors duration-200"
          >
            <FaTimes />
          </button>
        </div>

        {/* Status Section */}
        <div className={`p-4 rounded-lg mb-6 border ${getDecisionColor(randomStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getDecisionIcon(randomStatus)}
              <div>
                <h5 className="font-semibold text-slate-800">Status: {randomStatus}</h5>
                <p className="text-sm text-slate-600">
                  {randomStatus === 'Revise' ? 
                    "Project requires revisions before proceeding to next stage." :
                    "Project cannot proceed in its current form."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FaCalendar className="text-slate-400" />
              <span>Evaluated: {evaluationDate}</span>
            </div>
          </div>
        </div>

        {/* R&D Feedback Section */}
        <div className="space-y-6">
          <div>
            <h5 className="font-semibold text-slate-800 mb-4 text-lg">R&D Assessment Report</h5>
            
            {randomStatus === 'Revise' ? (
              <>
                {/* Objectives Assessment */}
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h6 className="font-semibold text-slate-700 mb-2">Objectives Assessment</h6>
                  <p className="text-sm text-slate-600">
                    Project objectives are generally clear but could benefit from more specific, measurable outcomes 
                    and better alignment with organizational strategic goals.
                  </p>
                </div>

                {/* Methodology Assessment */}
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h6 className="font-semibold text-slate-700 mb-2">Methodology Assessment</h6>
                  <p className="text-sm text-slate-600">
                    The proposed methodology is adequate but lacks sufficient detail in implementation approach 
                    and requires clearer documentation of research procedures and data analysis methods.
                  </p>
                </div>

                {/* Budget Assessment */}
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h6 className="font-semibold text-slate-700 mb-2">Budget Assessment</h6>
                  <p className="text-sm text-slate-600">
                    Budget allocation is generally reasonable but some line items require better justification 
                    and more detailed cost-benefit analysis for equipment and personnel expenses.
                  </p>
                </div>

                {/* Timeline Assessment */}
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h6 className="font-semibold text-slate-700 mb-2">Timeline Assessment</h6>
                  <p className="text-sm text-slate-600">
                    Project timeline is generally feasible but requires adjustments for certain phases 
                    and better risk mitigation planning for potential delays.
                  </p>
                </div>

                {/* Overall Assessment */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-semibold text-blue-700 mb-2">Overall Assessment</h6>
                  <p className="text-sm text-blue-700">
                    Project shows promise but requires moderate revisions across multiple assessment areas 
                    before it can proceed to the next evaluation stage.
                  </p>
                </div>
              </>
            ) : (
              /* Reject Status - Only show rejection reason */
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <h6 className="font-semibold text-red-700 mb-2">Reason for Rejection</h6>
                <p className="text-sm text-red-700">{rejectionReasons}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200">
          <button 
            onClick={onClose} 
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#C8102E] text-white hover:bg-[#a50d24] hover:scale-105 focus:outline-none transition-all duration-200 cursor-pointer text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;