import React from 'react';
import {X, FileText, FileSliders } from "lucide-react";
import templatePDF from '../../assets/template/DOST-Template.pdf';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden relative">
        {/* --- HEADER --- */}
        <div className="relative bg-white border-b border-gray-100 px-8 py-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <FileSliders className="w-5 h-5 text-[#C8102E]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#C8102E] tracking-tight">
                How the Process Works
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-normal">
                Comprehensive guide to DOST project proposal submission, evaluation, and monitoring.
              </p>
            </div>
          </div>
        </div>
        
        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 text-slate-700">
          <div className="relative">
            <div className="space-y-8">
              {/* Step 1 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-[#C8102E] flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-[#C8102E] group-hover:shadow-md transition-all duration-300 relative z-10">1</div>
                <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0"></div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-[#C8102E] group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Download & Submit Documentation</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                 Ensure you have your <a href={templatePDF} download className="text-[#C8102E] hover:underline font-semibold inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> DOST project proposal template</a> ready and all required fields are properly filled out. Proceed to the Submission page to submit your proposal. Double-check all information before submitting, as it cannot be edited unless the R&D requests a revision. You will be notified through your Profile page.</p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-amber-500 flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-amber-500 group-hover:shadow-md transition-all duration-300 relative z-10">2</div>
                <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0"></div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-amber-500 group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Admin Checking & Assignment</h3>
                <p className="text-slate-600 leading-relaxed text-sm">The proposal you submit first goes to the Admin, where it will be checked for initial review. The Admin will then assign it to the appropriate R&D staff for evaluation, though the Admin also maintains the option to directly review and evaluate the proposal themselves.</p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-blue-600 flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-blue-600 group-hover:shadow-md transition-all duration-300 relative z-10">3</div>
                <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0"></div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-blue-600 group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">R&D Technical Evaluation</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Once your proposal is forwarded by the Admin, the Research and Development (R&D) division will review your submitted information and attached documents. They will then evaluate your proposal and may request a revision, reject the submission, or pass it to the evaluators for further review.</p>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-purple-600 flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-purple-600 group-hover:shadow-md transition-all duration-300 relative z-10">4</div>
                <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0"></div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-purple-600 group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Evaluators’ Assessment Panel</h3>
                <p className="text-slate-600 leading-relaxed text-sm">Once passed by the R&D division, the proposal is forwarded to the evaluators for assessment. Evaluators review the proposal and assign scores based on key aspects such as the title, timeline, and budget to determine feasibility. They also provide detailed feedback and comments. The evaluated proposal is then returned to the R&D division for review of the evaluators’ scores and recommendations.</p>
              </div>
            </div>
            
            {/* Step 5 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-blue-800 flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-blue-800 group-hover:shadow-md transition-all duration-300 relative z-10">5</div>
                <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0"></div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-blue-800 group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Consolidated Review & Endorsement</h3>
                <p className="text-slate-600 leading-relaxed text-sm">After receiving all evaluators’ scores and feedback, the Research and Development (R&D) division reviews and consolidates the results. Based on this evaluation, the R&D may request revisions and return the proposal to the proponent, reject the submission, or endorse it for funding.</p>
              </div>
            </div>
            
            {/* Step 6 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-green-600 flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-green-600 group-hover:shadow-md transition-all duration-300 relative z-10">6</div>
                <div className="absolute top-12 -bottom-8 w-0.5 bg-slate-200 hidden sm:block z-0"></div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-green-600 group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">RDEC Funding Deliberation</h3>
                <p className="text-slate-600 leading-relaxed text-sm">This step will be then review by the Research and Development (R&D) Committee. The committee will meet and discuss the proposal, and based on their evaluation, they will decide whether to approve the project for funding or not.</p>
              </div>
            </div>
            
            {/* Step 7 */}
            <div className="flex gap-4 relative z-10 group">
              <div className="relative flex flex-col items-center w-12 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-white border-2 border-slate-200 text-red-500 flex items-center justify-center shrink-0 font-bold shadow-sm group-hover:border-red-500 group-hover:shadow-md transition-all duration-300 relative z-10">7</div>
              </div>
              <div className="bg-white rounded-xl p-5 border-2 border-slate-200 shadow-sm flex-1 group-hover:border-red-500 group-hover:shadow-md transition-all duration-300">
                <h3 className="font-bold text-slate-900 text-lg mb-2">Implementation & Progress Monitoring</h3>
                <p className="text-slate-600 leading-relaxed text-sm">After your project has been funded, you may request the budget for the start of the quarter and for the following quarters. You are required to report your progress percentage, submit reports, and provide the necessary documents until the project is successfully completed and all allocated funds have been utilized.</p>
              </div>
            </div>
            </div>
          </div>
        </div>
        
        {/* --- FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;