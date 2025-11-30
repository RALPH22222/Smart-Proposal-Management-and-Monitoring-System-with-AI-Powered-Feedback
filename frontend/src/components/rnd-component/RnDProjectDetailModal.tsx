// components/rnd-component/RnDProjectDetailModal.tsx

import React, { useState } from 'react';
import {
  Calendar, User, MapPin, DollarSign, X, CheckCircle, TrendingUp,
  AlertTriangle, Clock, PauseCircle, ChevronDown, ChevronUp, 
  FileText, Send, AlertOctagon, CheckSquare, ShieldAlert,
  Paperclip, Download, Eye // Added generic file icons
} from 'lucide-react';
import { type Project, type ProjectStatus } from '../../types/InterfaceProject';

interface RnDProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const RnDProjectDetailModal: React.FC<RnDProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  if (!project || !isOpen) return null;

  // --- Dynamic Styles based on Status ---
  const getThemeColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Completed': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', btn: 'bg-blue-600', icon: 'text-blue-600', lightBtn: 'bg-blue-100 text-blue-800' };
      case 'Planning': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', btn: 'bg-purple-600', icon: 'text-purple-600', lightBtn: 'bg-purple-100 text-purple-800' };
      case 'Active': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', btn: 'bg-emerald-600', icon: 'text-emerald-600', lightBtn: 'bg-emerald-100 text-emerald-800' };
      case 'Delayed': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', btn: 'bg-yellow-600', icon: 'text-yellow-600', lightBtn: 'bg-yellow-100 text-yellow-800' };
      case 'At Risk': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', btn: 'bg-orange-600', icon: 'text-orange-600', lightBtn: 'bg-orange-100 text-orange-800' };
      case 'On Hold': return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', btn: 'bg-slate-600', icon: 'text-slate-600', lightBtn: 'bg-slate-200 text-slate-800' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', btn: 'bg-slate-600', icon: 'text-slate-600', lightBtn: 'bg-slate-200 text-slate-800' };
    }
  };

  const theme = getThemeColor(project.status);
  const toggleMilestone = (id: string) => setExpandedMilestone(expandedMilestone === id ? null : id);

  // --- RENDER CONTENT FUNCTIONS ---

  // 1. PLANNING: Review Proposals (Purple)
  const renderPlanningContent = () => (
    <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4"/> Proposal Review Phase
            </h4>
            <p className="text-sm text-purple-800 mb-4">
                The proponent has submitted the following milestones for approval. You can accept, reject, or request revisions.
            </p>
        </div>
        {renderMilestoneList(true)} 
    </div>
  );

  // 2. ACTIVE: Monitor Progress & Approve Submissions (Green)
  const renderActiveContent = () => (
    <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600"/>
                <div>
                    <h4 className="font-bold text-emerald-900">Project in Progress</h4>
                    <p className="text-xs text-emerald-700">Monitoring proponent submissions</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold text-emerald-700">{project.completionPercentage}%</span>
                <p className="text-[10px] font-bold text-emerald-600">Complete</p>
            </div>
        </div>
        {renderMilestoneList()}
    </div>
  );

  // 3. COMPLETED: Read Only (Blue)
  const renderCompletedContent = () => (
    <div className="space-y-4">
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 text-center">
             <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-3"/>
             <h3 className="text-xl font-bold text-blue-900">Project Successfully Completed</h3>
             <p className="text-blue-700 text-sm mt-1">All milestones have been achieved, verified, and closed.</p>
             <div className="mt-4 w-full bg-blue-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full w-full"></div>
             </div>
             <span className="text-xs text-blue-600 font-bold mt-1 block">100% Executed</span>
        </div>
        {/* Force completed visual style for list */}
        <div className="opacity-75 pointer-events-none">
            {renderMilestoneList()}
        </div>
    </div>
  );

  // 4. DELAYED: Handle Extensions (Yellow)
  const renderDelayedContent = () => (
    <div className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 animate-pulse">
            <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4"/> Attention Required: Overdue
            </h4>
            <p className="text-sm text-yellow-800">
                Milestones are overdue. Please review extension requests from the proponent below. If rejected, status remains delayed.
            </p>
        </div>
        {renderMilestoneList()}
    </div>
  );

  // 5. AT RISK: High Alert (Orange)
  const renderAtRiskContent = () => (
    <div className="space-y-4">
         <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4"/> Critical Status
            </h4>
            <p className="text-sm text-orange-800">
                Multiple milestones are significantly behind schedule. Immediate intervention or meeting recommended.
            </p>
        </div>
        {renderMilestoneList()}
    </div>
  );

  // 6. ON HOLD: Reason Display (Gray)
  const renderOnHoldContent = () => (
    <div className="space-y-4">
        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300">
             <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <PauseCircle className="w-4 h-4"/> Project Suspended
            </h4>
            <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-xs font-bold text-slate-500">Reason for Hold</span>
                <p className="text-slate-800 mt-1 italic">"{project.onHoldReason || "No specific reason provided."}"</p>
            </div>
            <p className="text-xs text-slate-500 mt-2">
                This request was accepted. To resume, please contact the proponent.
            </p>
        </div>
        <div className="opacity-50 pointer-events-none">
            {renderMilestoneList()}
        </div>
    </div>
  );

  // --- Shared Milestone List Logic ---
  const renderMilestoneList = (isPlanningMode = false) => (
    <div className="space-y-3">
      <div className="flex justify-between items-end border-b pb-2">
        <h3 className="font-bold text-slate-800 text-sm tracking-wider">Milestones</h3>
      </div>
      
      {project.milestones?.map((milestone) => {
        const isExpanded = expandedMilestone === milestone.id;
        
        // Define Icon & Color based on individual milestone status
        let statusIcon = <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>;
        let statusColorClass = "bg-white border-slate-200";

        if (project.status === 'Completed' || milestone.completed) {
            statusIcon = <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-50"/>;
            statusColorClass = "bg-blue-50 border-blue-200";
        } else if (milestone.status === 'Delayed') {
            statusIcon = <AlertTriangle className="w-5 h-5 text-yellow-600 fill-yellow-50"/>;
            statusColorClass = "bg-yellow-50 border-yellow-200";
        } else if (milestone.status === 'Review Required') {
            statusIcon = <ShieldAlert className="w-5 h-5 text-emerald-600 fill-emerald-50"/>;
            statusColorClass = "bg-emerald-50 border-emerald-200";
        } else if (milestone.status === 'Proposed') {
            statusIcon = <FileText className="w-5 h-5 text-purple-600"/>;
            statusColorClass = "bg-purple-50 border-purple-200";
        }

        return (
          <div key={milestone.id} className={`border rounded-lg transition-all duration-200 overflow-hidden ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : 'hover:border-slate-300'}`}>
            {/* Milestone Header */}
            <div 
                className={`p-3 flex items-center justify-between cursor-pointer ${statusColorClass}`}
                onClick={() => toggleMilestone(milestone.id)}
            >
              <div className="flex items-center gap-3">
                {statusIcon}
                <div>
                    <p className="font-semibold text-sm text-slate-800">{milestone.name}</p>
                    <p className="text-xs text-slate-500">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold tracking-wider text-slate-500">
                    {project.status === 'Completed' ? 'Completed' : milestone.status}
                 </span>
                 {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
              </div>
            </div>

            {/* Milestone Body (Expanded) */}
            {isExpanded && (
              <div className="p-4 bg-white border-t border-slate-100 space-y-4 animate-in slide-in-from-top-1 duration-200">
                
                {/* A. PLANNING MODE: Accept/Reject Proposal */}
                {isPlanningMode && (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600"><span className="font-semibold">Description:</span> {milestone.description}</p>
                        <div className="flex gap-2 pt-2">
                            <button className="flex-1 bg-purple-600 text-white py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition">Accept</button>
                            <button className="flex-1 bg-white border border-purple-300 text-purple-700 py-2 rounded-md text-sm font-medium hover:bg-purple-50 transition">Revise</button>
                            <button className="px-3 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100">Reject</button>
                        </div>
                    </div>
                )}

                {/* B. ACTIVE MODE: Review Submission WITH ATTACHMENT FILE */}
                {!isPlanningMode && milestone.submissionProof && !milestone.completed && project.status === 'Active' && (
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        
                        {/* Status Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-emerald-100 rounded-full">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-emerald-900">Completion Request</h5>
                                <p className="text-xs text-emerald-700">The proponent has marked this milestone as complete.</p>
                            </div>
                        </div>

                        {/* File Attachment Card */}
                        <div className="bg-white p-3 rounded-lg border border-emerald-200 mb-4 flex items-start gap-3 shadow-sm">
                            <div className="p-2 bg-slate-100 rounded flex-shrink-0">
                                <Paperclip className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">
                                    Evidence_of_Completion_v1.pdf
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-1 italic mb-2">
                                    "{milestone.submissionProof}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline">
                                        <Download className="w-3 h-3"/> Download File
                                    </button>
                                    <button className="text-xs font-medium text-slate-600 hover:text-slate-700 flex items-center gap-1 hover:underline">
                                        <Eye className="w-3 h-3"/> Preview
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                            <span>Submitted on: <span className="font-medium">{milestone.submissionDate}</span></span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-sm transition-colors">
                                Approve & Mark Complete
                            </button>
                            <button className="flex-1 bg-white border border-emerald-200 text-emerald-700 py-2 rounded-lg text-sm font-medium hover:bg-emerald-50 transition-colors">
                                Request Changes
                            </button>
                        </div>
                    </div>
                )}

                {/* C. DELAYED MODE: Review Extension */}
                {!isPlanningMode && milestone.extensionRequest && project.status === 'Delayed' && (
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                          <h5 className="text-xs font-bold text-yellow-800 mb-2 flex items-center gap-1">
                             <Clock className="w-3 h-3"/> Extension Request
                          </h5>
                          <div className="flex justify-between text-sm mb-1">
                             <span className="text-slate-500">Proposed New Date:</span>
                             <span className="font-bold text-slate-800">{new Date(milestone.extensionRequest.newDate).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 bg-white p-2 rounded border border-yellow-100 mb-3">
                             Reason: {milestone.extensionRequest.reason}
                          </p>
                          <div className="flex gap-2">
                             <button className="flex-1 bg-yellow-600 text-white py-1.5 rounded text-sm font-medium hover:bg-yellow-700">Accept Extension</button>
                             <button className="flex-1 bg-white border border-yellow-200 text-yellow-700 py-1.5 rounded text-sm font-medium hover:bg-yellow-50">Reject (Keep Delayed)</button>
                          </div>
                    </div>
                )}
                
                {/* Default Description */}
                {!isPlanningMode && !milestone.submissionProof && !milestone.extensionRequest && (
                    <p className="text-sm text-slate-600">
                        {milestone.description || "No additional details provided."}
                    </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // --- Financial Requests Section (All except Completed/Planning usually) ---
  const renderFundRequests = () => {
    // Hide for completed
    if (project.status === 'Completed') return null;
    
    // Logic: Active, Delayed, At Risk, On Hold often need money. Planning might not yet.
    if (!project.fundRequests || project.fundRequests.length === 0) return null;
    
    return (
        <div className="mt-6 pt-4 border-t border-slate-200">
             <h3 className="font-bold text-slate-800 text-sm tracking-wider mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-500"/> Fund Requests
            </h3>
            <div className="space-y-3">
                {project.fundRequests.map(req => (
                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-lg">₱{req.amount.toLocaleString()}</p>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{req.dateRequested}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{req.reason}</p>
                        </div>
                        <div className="flex gap-2">
                            {req.status === 'Pending' ? (
                                <>
                                    <button className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium">
                                        <CheckSquare className="w-4 h-4"/> Approve
                                    </button>
                                    <button className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium">
                                        <X className="w-4 h-4"/> Reject
                                    </button>
                                </>
                            ) : (
                                <span className="text-xs font-bold text-slate-400 border border-slate-200 px-2 py-1 rounded bg-slate-50">
                                    {req.status}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
  }

  // --- MAIN MODAL STRUCTURE ---
  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]`}>
        
        {/* Header */}
        <div className={`${theme.bg} p-6 border-b ${theme.border} flex justify-between items-start rounded-t-2xl`}>
            <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/80 mb-3 ${theme.text} border ${theme.border} shadow-sm`}>
                    {project.status === 'Delayed' && <AlertTriangle className="w-3 h-3"/>}
                    {project.status === 'Active' && <TrendingUp className="w-3 h-3"/>}
                    {project.status === 'Planning' && <FileText className="w-3 h-3"/>}
                    {project.status}
                </div>
                <h2 className={`text-2xl font-bold ${theme.text} mb-1`}>{project.title}</h2>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium opacity-80 text-slate-700">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {project.principalInvestigator}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {project.department}</span>
                    <span className="font-mono bg-white/50 px-1 rounded">{project.projectId}</span>
                </div>
            </div>
            <button onClick={onClose} className={`p-2 hover:bg-white/50 rounded-full transition-colors ${theme.text}`}>
                <X className="w-6 h-6"/>
            </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT COLUMN: Main Status Logic (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {project.status === 'Planning' && renderPlanningContent()}
                    {project.status === 'Active' && renderActiveContent()}
                    {project.status === 'Completed' && renderCompletedContent()}
                    {project.status === 'Delayed' && renderDelayedContent()}
                    {project.status === 'At Risk' && renderAtRiskContent()}
                    {project.status === 'On Hold' && renderOnHoldContent()}

                    {renderFundRequests()}
                </div>

                {/* RIGHT COLUMN: Project Info Sidebar (1/3 width) */}
                <div className="space-y-4">
                    {/* Budget Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h5 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                            <DollarSign className="w-3 h-3"/> Financials
                        </h5>
                        <p className="text-3xl font-bold text-slate-800 tracking-tight">₱{project.budget.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Total Allocated Budget</p>
                        
                        {project.budgetSources && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                <p className="text-xs font-semibold text-slate-600">Sources:</p>
                                {project.budgetSources.map((source, idx) => (
                                    <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-slate-500">{source.source}</span>
                                        <span className="font-medium">₱{source.total}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h5 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                            <Calendar className="w-3 h-3"/> Timeline
                        </h5>
                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                            <div className="relative">
                                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${project.status === 'Completed' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                <p className="text-xs text-slate-500">Start Date</p>
                                <p className="text-sm font-medium text-slate-800">{new Date(project.startDate).toLocaleDateString()}</p>
                            </div>
                            <div className="relative">
                                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${project.status === 'Completed' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                <p className="text-xs text-slate-500">Target End</p>
                                <p className="text-sm font-medium text-slate-800">{new Date(project.endDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-2xl">
            <button 
                className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-800 font-medium hover:bg-slate-50 rounded-lg transition-colors" 
                onClick={onClose}
            >
                Close
            </button>
            
            {project.status === 'Active' && (
                <button className="px-5 py-2.5 bg-[#C8102E] text-white rounded-lg text-sm font-medium hover:bg-[#A00E26] flex items-center gap-2 shadow-sm">
                    <Send className="w-4 h-4"/> Message Proponent
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default RnDProjectDetailModal;