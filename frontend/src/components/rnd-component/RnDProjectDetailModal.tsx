import React from 'react';
import {
  Calendar,
  User,
  MapPin,
  DollarSign,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
  Target,
  BarChart3
} from 'lucide-react';
import { type Project, type ProjectStatus, type ProjectPhase } from '../../types/InterfaceProject';

interface RnDProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  getStatusBadge: (status: ProjectStatus) => string;
  getPhaseBadge: (phase: ProjectPhase) => string;
  getDaysRemaining: (endDate: string) => number;
}

const RnDProjectDetailModal: React.FC<RnDProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  getStatusBadge,
  getPhaseBadge,
  getDaysRemaining
}) => {
  if (!project || !isOpen) return null;

  const daysRemaining = getDaysRemaining(project.endDate);
  const isOverdue = daysRemaining < 0 && project.completionPercentage < 100;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Compact */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <BarChart3 className="w-5 h-5 text-[#C8102E] flex-shrink-0" />
                <h2 className="text-lg font-bold text-slate-900 truncate">Project Details</h2>
                <div className={getStatusBadge(project.status)}>
                  {project.status}
                </div>
              </div>
              <h3 className="text-base font-medium text-slate-700 line-clamp-2 leading-tight">
                {project.title}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{project.principalInvestigator}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{project.department}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono">{project.projectId}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Main Content - Single Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Timeline Status */}
              <div className={`p-3 rounded-lg border ${
                isOverdue 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-green-600'}`} />
                  <span className="text-sm font-medium text-slate-700">Timeline</span>
                </div>
                <p className={`text-sm font-semibold ${isOverdue ? 'text-red-700' : 'text-green-700'}`}>
                  {isOverdue ? (
                    <span>{Math.abs(daysRemaining)} days overdue</span>
                  ) : (
                    <span>{daysRemaining} days remaining</span>
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </p>
              </div>

              {/* Progress */}
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                </div>
                <p className="text-sm font-semibold text-blue-700">{project.completionPercentage}% Complete</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${project.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Budget */}
              <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-slate-700">Budget</span>
                </div>
                <p className="text-sm font-semibold text-yellow-700">₱{project.budget.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Total allocated</p>
              </div>

              {/* Current Phase */}
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Phase</span>
                </div>
                <div className="text-sm">
                  <span className={getPhaseBadge(project.currentPhase)}>
                    {project.currentPhase}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Research Station */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C8102E]" />
                    Research & Development Station
                  </h4>
                  <p className="text-sm text-slate-700">{project.researchArea}</p>
                </div>

                {/* Collaborators */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C8102E]" />
                    Collaborators
                  </h4>
                  {project.collaborators && project.collaborators.length > 0 ? (
                    <ul className="text-sm text-slate-700 space-y-2">
                      {project.collaborators.map((collaborator, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#C8102E] rounded-full flex-shrink-0"></div>
                          <span>{collaborator}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No collaborators listed</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Project Description */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C8102E]" />
                    Project Description
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Timeline Details */}
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C8102E]" />
                    Project Timeline
                  </h4>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Start Date:</span>
                      <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>End Date:</span>
                      <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestones Section */}
            {project.milestones && project.milestones.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#C8102E]" />
                  Project Milestones
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {project.milestones.map((milestone, index) => (
                    <div 
                      key={index}
                      className="bg-white rounded-lg p-3 border border-slate-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="text-sm font-medium text-slate-900 flex-1 pr-2">
                          {milestone.name}
                        </h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          milestone.completed 
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : new Date(milestone.dueDate) < new Date()
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }`}>
                          {milestone.completed ? 'Completed' : new Date(milestone.dueDate) < new Date() ? 'Overdue' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                        {milestone.description && (
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RnDProjectDetailModal;