import React from 'react';
import {
  X,
  Building2,
  Users,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,      
  Download,
  AlertTriangle,
  XCircle,
  GitBranch,
  Clock
} from "lucide-react";
import type { Proposal, ProposalStatus } from '../../types/InterfaceProposal';
import templatePDF from '../../assets/template/DOST-Template.pdf';

interface DetailedProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
}

const DetailedProposalModal: React.FC<DetailedProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
}) => {
  if (!isOpen || !proposal) return null;

  // Mock Assessment Data
  const mockAssessment = {
    methodology: "The proposed statistical analysis method (ANOVA) needs further justification. Consider using regression analysis for continuous variables.",
    budget: "The travel expenses listed for Q3 seem excessive relative to the project scope. Please provide a detailed breakdown.",
    timeline: "The data collection phase is too short (2 weeks). Recommended extending to at least 1 month.",
    overall: "The proposal is promising but requires adjustments in the methodology and budget allocation before proceeding to evaluation."
  };

  const mockRejection = "The proposal does not align with the current priority agenda of the institution. Specifically, the focus on blockchain for this specific agricultural application is not feasible with current resources.";

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Revised Proposal': return 'indigo';
      case 'Revision Required': return 'orange';
      case 'Rejected Proposal': return 'red';
      case 'Sent to Evaluators': return 'emerald';
      default: return 'amber';
    }
  };

  const statusColor = getStatusColor(proposal.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
             <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border border-${statusColor}-200 bg-${statusColor}-50 text-${statusColor}-700`}>
                   {proposal.status}
                </span>
                <span className="text-xs text-slate-500">DOST Form No. 1B</span>
             </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              {proposal.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="space-y-4 sm:space-y-6">

             {/* 1. REVISION REQUIRED: Show Assessments */}
             {proposal.status === 'Revision Required' && (
                <div className="bg-orange-50 rounded-lg p-5 border border-orange-200">
                   <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Revision Requirements
                   </h3>
                   <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-orange-100">
                         <p className="text-xs font-bold text-orange-700 uppercase mb-1">Methodology Assessment</p>
                         <p className="text-sm text-slate-700">{mockAssessment.methodology}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-orange-100">
                         <p className="text-xs font-bold text-orange-700 uppercase mb-1">Budget Assessment</p>
                         <p className="text-sm text-slate-700">{mockAssessment.budget}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-orange-100">
                         <p className="text-xs font-bold text-orange-700 uppercase mb-1">Timeline Assessment</p>
                         <p className="text-sm text-slate-700">{mockAssessment.timeline}</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded border border-orange-200">
                         <p className="text-xs font-bold text-orange-800 uppercase mb-1">Overall Comments</p>
                         <p className="text-sm text-orange-900 italic">"{mockAssessment.overall}"</p>
                      </div>
                   </div>
                </div>
             )}

            {/* 2. REJECTED: Show Explanation */}
            {proposal.status === 'Rejected Proposal' && (
                <div className="bg-red-50 rounded-lg p-5 border border-red-200">
                   <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Rejection Reason
                   </h3>
                   <p className="text-sm text-red-900 leading-relaxed">
                      {mockRejection}
                   </p>
                </div>
             )}

            {/* 3. DOCUMENTS SECTION */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
               <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" />
                  Project Documents
               </h3>
               
               {/* Revised Proposal View */}
               {proposal.status === ('Revised Proposal' as ProposalStatus) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Previous Version */}
                     <div className="border border-slate-300 rounded-lg p-3 bg-slate-100 opacity-75">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Previous Version
                           </span>
                           <span className="text-[10px] text-slate-400">Oct 15, 2023</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-12 bg-slate-200 rounded flex items-center justify-center">
                              <FileText className="w-5 h-5 text-slate-400" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">Proposal_v1.pdf</p>
                              <p className="text-xs text-slate-500">2.4 MB</p>
                           </div>
                           <a href={proposal.documentUrl || templatePDF} download className="p-2 text-slate-500 hover:bg-slate-200 rounded-full">
                              <Download className="w-4 h-4" />
                           </a>
                        </div>
                     </div>

                     {/* New Version */}
                     <div className="border border-indigo-200 rounded-lg p-3 bg-white shadow-sm ring-1 ring-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">
                              <GitBranch className="w-3 h-3" /> Latest Revision
                           </span>
                           <span className="text-[10px] text-indigo-400">Just now</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-12 bg-indigo-50 rounded flex items-center justify-center border border-indigo-100">
                              <FileText className="w-5 h-5 text-indigo-500" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">Proposal_v2_Revised.pdf</p>
                              <p className="text-xs text-slate-500">2.6 MB</p>
                           </div>
                           <a href={proposal.documentUrl || templatePDF} download className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full">
                              <Download className="w-4 h-4" />
                           </a>
                        </div>
                     </div>
                  </div>
               ) : (
                  // Standard View
                  <div className="border border-slate-200 rounded-lg p-3 bg-white flex items-center justify-between group hover:border-[#C8102E] transition-colors cursor-pointer">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-red-50 rounded flex items-center justify-center border border-red-100">
                           <FileText className="w-5 h-5 text-[#C8102E]" />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-slate-900 group-hover:text-[#C8102E] transition-colors">Full Project Proposal.pdf</p>
                           <p className="text-xs text-slate-500">PDF Document • 2.4 MB</p>
                        </div>
                     </div>
                     <a 
                        href={proposal.documentUrl || templatePDF} 
                        download 
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-[#C8102E] hover:text-white rounded-md transition-all"
                     >
                        <Download className="w-3 h-3" />
                        Download
                     </a>
                  </div>
               )}
            </div>

            {/* 4. Leader & Agency Information */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-[#C8102E]" />
                Leader & Agency Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Leader / Proponent</span>
                  <p className="font-semibold text-slate-900 text-sm">{proposal.proponent}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gender</span>
                  <p className="font-medium text-slate-900 text-sm">{proposal.gender}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Agency</span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <p className="font-medium text-slate-900 text-sm">{proposal.agency}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Address</span>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                    <p className="text-slate-900 text-sm">{proposal.address}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Telephone</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <p className="text-sm text-slate-900">{proposal.telephone}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Email</span>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <p className="text-sm text-slate-900">{proposal.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Cooperating Agencies */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                Cooperating Agencies
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">{proposal.cooperatingAgencies}</p>
            </div>

            {/* 6. R&D Station & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-[#C8102E]" />
                  R&D Station
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">{proposal.rdStation}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-[#C8102E]" />
                  Classification
                </h3>
                <p className="text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">{proposal.classification}:</span>{" "}
                  {proposal.classificationDetails}
                </p>
              </div>
            </div>

            {/* 7. Schedule */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" />
                Implementing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">Duration</span>
                  <p className="font-semibold text-slate-900 mt-1">{proposal.duration}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">Start Date</span>
                  <p className="font-semibold text-slate-900 mt-1">{proposal.startDate}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">End Date</span>
                  <p className="font-semibold text-slate-900 mt-1">{proposal.endDate}</p>
                </div>
              </div>
            </div>

            {/* 8. Budget Table */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8102E]" />
                Estimated Budget by Source
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-left font-semibold text-slate-700">Source of Funds</th>
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">PS</th>
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">MOOE</th>
                      <th className="border-b border-r border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">CO</th>
                      <th className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-700">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.budgetSources.map((budget, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="border-b border-r border-slate-300 px-3 py-2 font-medium text-slate-800">{budget.source}</td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">{budget.ps}</td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">{budget.mooe}</td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">{budget.co}</td>
                        <td className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">{budget.total}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold">
                      <td className="border-r border-slate-300 px-3 py-2 text-slate-900">TOTAL</td>
                      <td className="border-r border-slate-300 px-3 py-2 text-right text-slate-900" colSpan={3}>→</td>
                      <td className="px-3 py-2 text-right text-[#C8102E] text-sm">{proposal.budgetTotal}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                PS: Personal Services | MOOE: Maintenance and Other Operating Expenses | CO: Capital Outlay
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailedProposalModal;