import React, { useState } from 'react';
import {
  Clock,
  Edit2,
  User,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck
} from 'lucide-react';

import EvaluatorPageModal from '../../../components/rnd-component/RnDEvaluatorPageModal';
import type { EvaluatorOption } from '../../../components/rnd-component/RnDEvaluatorPageModal';
import { Tag } from 'lucide-react';

// --- INTERFACES ---

interface Assignment {
  id: string;
  proposalId: string;
  proposalTitle: string;
  evaluatorIds: string[];
  evaluatorNames: string[];
  department: string;
  deadline: string;
  status: 'Pending' | 'Accepts' | 'Completed' | 'Overdue' | 'Rejected' | 'Extension Requested';
  projectType: string;
}

interface HistoryRecord {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  decision: 'Accept' | 'Reject';
  comment: string;
  date: string;
}

interface ExtensionRequest {
  requestId: string;
  evaluatorId: string;
  evaluatorName: string;
  reason: string;
  requestedNewDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface ProposalHistoryData {
  records: HistoryRecord[];
  extensionRequests: ExtensionRequest[]; 
}

export const EvaluatorPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Edit Assignment Modal States
  const [showModal, setShowModal] = useState(false);
  const [currentEvaluators, setCurrentEvaluators] = useState<EvaluatorOption[]>([]);
  const [selectedProposalTitle, setSelectedProposalTitle] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- MOCK ASSIGNMENTS ---
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      proposalId: 'p1',
      proposalTitle: 'AI-driven Smart Proposal Management System',
      evaluatorIds: ['e1', 'e2'],
      evaluatorNames: ['Dr. Alice Santos', 'Prof. Ben Reyes'],
      department: 'Information Technology',
      deadline: '2025-10-20',
      status: 'Extension Requested',
      projectType: 'ICT'
    },
    {
      id: '2',
      proposalId: 'p2',
      proposalTitle: 'Blockchain-based Voting Application',
      evaluatorIds: ['e3'],
      evaluatorNames: ['Engr. Carla Lim'],
      department: 'Information Technology',
      deadline: '2025-10-25',
      status: 'Pending',
      projectType: 'Public Safety'
    },
    {
      id: '3',
      proposalId: 'p3',
      proposalTitle: 'IoT-based Waste Management for Zamboanga City',
      evaluatorIds: ['e4', 'e5'],
      evaluatorNames: ['Dr. John Cruz', 'Prof. Eva Martinez'],
      department: 'Engineering',
      deadline: '2025-10-30',
      status: 'Rejected',
      projectType: 'Environment'
    },
    {
        id: '4',
        proposalId: 'p4',
        proposalTitle: 'Machine Learning for Agricultural Optimization',
        evaluatorIds: ['e6', 'e7'],
        evaluatorNames: ['Dr. Maria Santos', 'Prof. Carlos Reyes'],
        department: 'Agriculture',
        deadline: '2025-11-05',
        status: 'Completed',
        projectType: 'Agriculture'
      },
      {
        id: '5',
        proposalId: 'p5',
        proposalTitle: 'Renewable Energy Microgrid Systems',
        evaluatorIds: ['e8'],
        evaluatorNames: ['Engr. David Tan'],
        department: 'Engineering',
        deadline: '2025-09-15',
        status: 'Overdue',
        projectType: 'Energy'
      }
  ]);

  // --- MOCK HISTORY & EXTENSION DATA ---
  const [mockHistoryData, setMockHistoryData] = useState<Record<string, ProposalHistoryData>>({
    p1: {
      records: [
        { id: 'h1', evaluatorId: 'e2', evaluatorName: 'Prof. Ben Reyes', decision: 'Accept', comment: 'Excellent and feasible research idea.', date: '2025-10-02' },
      ],
      extensionRequests: [
        {
          requestId: 'ext1',
          evaluatorId: 'e1',
          evaluatorName: 'Dr. Alice Santos',
          reason: 'Need more time to review the updated dataset schema.',
          requestedNewDate: '2025-10-25',
          status: 'Pending'
        }
      ]
    },
    p3: {
        records: [
            { id: 'h2', evaluatorId: 'e5', evaluatorName: 'Prof. Eva Martinez', decision: 'Reject', comment: 'Methodology is unclear.', date: '2025-10-02' },
            { id: 'h3', evaluatorId: 'e4', evaluatorName: 'Dr. John Cruz', decision: 'Reject', comment: 'Budget is too high.', date: '2025-10-02' }
        ],
        extensionRequests: []
    }
  });

  // --- ACTIONS ---

  // Handle Extension actions directly from the Modal
  const handleExtensionAction = (evaluatorId: string, action: 'Accept' | 'Reject') => {
    if (!selectedProposalId) return;

    // 1. Update Mock Data (Backend Simulation)
    setMockHistoryData((prev) => {
        const currentData = prev[selectedProposalId];
        if (!currentData) return prev;
        
        const updatedExtensions: ExtensionRequest[] = currentData.extensionRequests.map((req) => 
            req.evaluatorId === evaluatorId 
            ? { ...req, status: (action === 'Accept' ? 'Approved' : 'Rejected') as ExtensionRequest['status'] }
            : req
        );

        return {
            ...prev,
            [selectedProposalId]: {
                ...currentData,
                extensionRequests: updatedExtensions
            }
        };
    });

    // 2. Update the "Current Evaluators" list currently visible in the modal
    // This allows the modal to re-render immediately without closing
    setCurrentEvaluators(prev => prev.map(ev => {
        if (ev.id === evaluatorId) {
            // If approved, we might clear the request or change status. 
            // For now, let's change status to Pending (with new date implied) or whatever logic fits.
            return { 
                ...ev, 
                status: action === 'Accept' ? 'Pending' : 'Pending', // Reset status 
                extensionReason: undefined, // Clear extension UI
                extensionDate: undefined 
            };
        }
        return ev;
    }));

    // 3. Update main table status if needed (Optional)
    if(action === 'Accept') {
         setAssignments(prev => prev.map(a => 
             a.proposalId === selectedProposalId && a.status === 'Extension Requested'
             ? { ...a, status: 'Pending' } // Reset general status
             : a
         ));
    }
  };

  const handleEdit = (id: string) => {
    const record = assignments.find((a) => a.id === id);
    if (record) {
      setSelectedProposalTitle(record.proposalTitle);
      setSelectedProposalId(record.proposalId);

      // --- MERGE LOGIC ---
      // We need to combine the basic assignment info with the detailed history/extension info
      const historyData = mockHistoryData[record.proposalId] || { records: [], extensionRequests: [] };

      const mergedEvaluators: EvaluatorOption[] = record.evaluatorNames.map((name, index) => {
        const evId = record.evaluatorIds[index] || `temp-${index}`;
        
        // Check for specific history (Decision)
        const historyRecord = historyData.records.find(h => h.evaluatorId === evId);
        
        // Check for specific extension request
        const extensionReq = historyData.extensionRequests.find(ext => ext.evaluatorId === evId && ext.status === 'Pending');

        let status: EvaluatorOption['status'] = 'Pending';
        let comment = undefined;
        let extensionDate = undefined;
        let extensionReason = undefined;

        if (extensionReq) {
            status = 'Extension Requested';
            extensionDate = extensionReq.requestedNewDate;
            extensionReason = extensionReq.reason;
        } else if (historyRecord) {
            status = historyRecord.decision === 'Accept' ? 'Accepts' : 'Rejected';
            comment = historyRecord.comment;
        }

        return {
          id: evId,
          name,
          department: record.department,
          status,
          comment,
          extensionDate,
          extensionReason
        };
      });

      setCurrentEvaluators(mergedEvaluators);
      setShowModal(true);
    }
  };

  const handleReassignEvaluators = (newEvaluators: EvaluatorOption[]) => {
    console.log('Reassigned Evaluators for:', selectedProposalTitle, newEvaluators);
    setShowModal(false);
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.evaluatorNames.join(', ').toLowerCase().includes(search.toLowerCase()) ||
      a.proposalTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + itemsPerPage);

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'ICT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Healthcare': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Agriculture': return 'bg-green-100 text-green-700 border-green-200';
      case 'Energy': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Public Safety': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen lg:h-screen flex flex-col lg:flex-row gap-0 lg:gap-6">
      <div className="flex-1 flex p-6 flex-col gap-4 sm:gap-6 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#C8102E] leading-tight">
                Evaluator Assignment Tracker
              </h1>
              <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                Track evaluator assignments, deadlines, and proposal statuses across departments
              </p>
            </div>
          </div>
        </header>

         {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
             <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Total Evaluators</h4>
                <p className="text-2xl font-bold text-purple-700">
                  {new Set(assignments.flatMap(a => a.evaluatorIds)).size}
                </p>
             </div>
             <div className="p-2 rounded-xl">
               <ClipboardCheck className="w-6 h-6 text-purple-600" />
             </div>
           </div>

           <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex justify-between items-center">
             <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Total Proposals</h4>
                <p className="text-2xl font-bold text-slate-800">
                  {new Set(assignments.map(a => a.proposalId)).size}
                </p>
             </div>
             <div className="p-2 rounded-xl">
               <FileText className="w-6 h-6 text-slate-600" />
             </div>
           </div>
        </div>

        {/* Filters */}
        <section className="flex-shrink-0">
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-4">
             <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                   </div>
                   <input
                     type="text"
                     placeholder="Search evaluators or proposal titles..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                   />
                </div>
                <div className="relative">
                   <select
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value)}
                     className="appearance-none bg-white pl-3 pr-8 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-[#C8102E] transition-colors"
                   >
                     <option value="All">All Statuses</option>
                     <option value="Pending">Pending</option>
                     <option value="Accepts">Accepts</option>
                     <option value="Extension Requested">Extension Requested</option>
                     <option value="Completed">Completed</option>
                     <option value="Overdue">Overdue</option>
                     <option value="Rejected">Rejected</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                      <Filter className="h-4 w-4 text-slate-400" />
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Assignments List */}
        <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
           <div className="p-4 border-b border-slate-200 bg-slate-50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <FileText className="w-5 h-5 text-[#C8102E]" />
                 Evaluator Assignments
             </h3>
           </div>
           <div className="flex-1 overflow-y-auto">
             {paginatedAssignments.map((assignment) => (
                <article key={assignment.id} className="p-4 hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100">
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                         <h2 className="text-base font-semibold text-slate-800 mb-2">{assignment.proposalTitle}</h2>
                         <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                               <User className="w-3 h-3" />
                               <span>{assignment.evaluatorNames.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                               <Clock className="w-3 h-3" />
                               <span>Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>
                            </div>
                            {/* Project Type Badge */}
                            {assignment.projectType && (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getProjectTypeColor(assignment.projectType)}`}>
                                <Tag className="w-3 h-3" />
                                {assignment.projectType}
                              </span>
                            )}
                         </div>
                            {/* Status Badge in List */}
                            {/* <span className={`px-2 py-0.5 rounded-full font-medium border ${
                                assignment.status === 'Extension Requested' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                assignment.status === 'Accepts' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                assignment.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                assignment.status === 'Overdue' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {assignment.status}
                            </span> */}
                       </div>
                      <div className="flex items-center gap-2">
                         {/* Removed separate History Button */}
                         <button onClick={() => handleEdit(assignment.id)} className="px-3 py-2 bg-[#C8102E] text-white rounded-lg hover:bg-[#A00E26] transition-colors text-xs font-medium flex items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Action
                         </button>
                      </div>
                   </div>
                </article>
             ))}
           </div>

           {/* Pagination Footer */}
           <div className="p-4 bg-slate-50 border-t border-slate-200 flex-shrink-0">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-slate-600">
                 <span>
                   Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAssignments.length)} of {filteredAssignments.length} assignments
                 </span>
                 <div className="flex items-center gap-2">
                    <button
                       onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                       disabled={currentPage === 1}
                       className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                       <ChevronLeft className="w-3 h-3" /> Previous
                    </button>
                    <span className="px-3 py-1.5 text-xs font-medium text-slate-600">
                       Page {currentPage} of {totalPages}
                    </span>
                    <button
                       onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                       disabled={currentPage === totalPages}
                       className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#C8102E] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                       Next <ChevronRight className="w-3 h-3" />
                    </button>
                 </div>
             </div>
           </div>
        </main>
      </div>

      {/* --- MERGED MODAL --- */}
      <EvaluatorPageModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentEvaluators={currentEvaluators}
        onReassign={handleReassignEvaluators}
        onExtensionAction={handleExtensionAction}
        proposalTitle={selectedProposalTitle}
      />
    </div>
  );
};

export default EvaluatorPage;