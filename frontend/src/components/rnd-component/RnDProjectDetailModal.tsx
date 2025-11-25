import React from 'react';
import {
  Calendar,
  User,
  MapPin,
  DollarSign,
  X,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Building2,
  Phone,
  Mail,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  FileText
} from 'lucide-react';
import { type Project, type ProjectStatus, type ProjectPhase } from '../../types/InterfaceProject';

interface BudgetSource {
  source: string;
  ps: string;
  mooe: string;
  co: string;
  total: string;
}

// Extend the Project type locally to support the detailed fields
// Removed assignment/evaluator related fields based on request
interface ExtendedProject extends Project {
  proponent?: string;
  gender?: string;
  address?: string;
  telephone?: string;
  email?: string;
  agency?: string;
  cooperatingAgencies?: string;
  rdStation?: string;
  classification?: string;
  classificationDetails?: string;
  modeOfImplementation?: string;
  priorityAreas?: string;
  sector?: string;
  discipline?: string;
  duration?: string;
  budgetSources?: BudgetSource[];
  budgetTotal?: string;
}

interface RnDProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  getStatusBadge: (status: ProjectStatus) => string;
  getPhaseBadge: (phase: ProjectPhase) => string;
  getDaysRemaining: (endDate: string) => number;
}

const RnDProjectDetailModal: React.FC<RnDProjectDetailModalProps> = ({
  project: baseProject,
  isOpen,
  onClose,
  getStatusBadge,
  getPhaseBadge,
  getDaysRemaining
}) => {
  if (!baseProject || !isOpen) return null;

  const project = baseProject as ExtendedProject;
  const daysRemaining = getDaysRemaining(project.endDate);
  const isOverdue = daysRemaining < 0 && project.completionPercentage < 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
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

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-6">
            
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Timeline Status */}
              <div className={`p-3 rounded-lg border ${
                isOverdue ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
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

            {/* Detailed Proposal Info */}
            <div className="space-y-4 sm:space-y-6">

              {/* 1. Leader & Agency Information */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-[#C8102E]" />
                  Leader & Agency Information
                </h3>

                {/* Leader Name & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Leader / Proponent
                    </span>
                    <p className="font-semibold text-slate-900 text-sm">
                      {project.principalInvestigator}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Gender
                    </span>
                    <p className="font-medium text-slate-900 text-sm">
                      {project.gender || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Agency & Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Agency
                    </span>
                    <div className="flex items-start gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <p className="font-medium text-slate-900 text-sm">
                        {project.agency || project.department}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                      Address
                    </span>
                    <div className="flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <p className="text-slate-900 text-sm">{project.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Details (Fax removed) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-xs text-slate-500">Telephone</span>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <p className="text-sm text-slate-900">
                        {project.telephone || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Email</span>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <p className="text-sm text-slate-900">{project.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Cooperating Agencies */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#C8102E]" />
                  Cooperating Agencies
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  {project.cooperatingAgencies || (project.collaborators ? project.collaborators.join(', ') : 'None')}
                </p>
              </div>

              {/* R&D Station & Classification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Microscope className="w-4 h-4 text-[#C8102E]" />
                    Research & Development Station
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {project.rdStation || project.researchArea}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Tags className="w-4 h-4 text-[#C8102E]" />
                    Classification
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {project.classification || 'N/A'}:
                    </span>{" "}
                    {project.classificationDetails}
                  </p>
                </div>
              </div>

              {/* Mode & Priority Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C8102E]" />
                    Mode of Implementation
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {project.modeOfImplementation || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#C8102E]" />
                    Priority Areas
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {project.priorityAreas || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Sector & Discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#C8102E]" />
                    Sector/Commodity
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {project.sector || 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#C8102E]" />
                    Discipline
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700">
                    {project.discipline || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C8102E]" />
                  Implementing Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wide">
                      Duration
                    </span>
                    <p className="font-semibold text-slate-900 mt-1">
                      {project.duration || `${Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wide">
                      Start Date
                    </span>
                    <p className="font-semibold text-slate-900 mt-1">
                      {new Date(project.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs uppercase tracking-wide">
                      End Date
                    </span>
                    <p className="font-semibold text-slate-900 mt-1">
                      {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget Table */}
              {project.budgetSources && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#C8102E]" />
                    Estimated Budget by Source
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-300">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border-b border-r border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">
                            Source of Funds
                          </th>
                          <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            PS
                          </th>
                          <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            MOOE
                          </th>
                          <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            CO
                          </th>
                          <th className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">
                            TOTAL
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.budgetSources.map((budget, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="border-b border-r border-slate-300 px-3 py-2 font-medium text-slate-800">
                              {budget.source}
                            </td>
                            <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                              {budget.ps}
                            </td>
                            <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                              {budget.mooe}
                            </td>
                            <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                              {budget.co}
                            </td>
                            <td className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                              {budget.total}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-200 font-bold">
                          <td className="border-r border-slate-300 px-3 py-2 text-slate-900">
                            TOTAL
                          </td>
                          <td
                            className="border-r border-slate-300 px-3 py-2 text-right text-slate-900"
                            colSpan={3}
                          >
                            →
                          </td>
                          <td className="px-3 py-2 text-right text-[#C8102E] text-sm">
                            {project.budgetTotal || project.budget.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    PS: Personal Services | MOOE: Maintenance and Other Operating
                    Expenses | CO: Capital Outlay
                  </p>
                </div>
              )}
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