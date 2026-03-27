import React from 'react';
import { X, FileText, Download } from 'lucide-react';
import templatePDF from '../../assets/template/DOST_Form_No.1b.pdf';
import templateDOCX from '../../assets/template/DOST_Form_No.1b.docx';

interface TemplateViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateUrl?: string;
}

const TemplateViewModal: React.FC<TemplateViewModalProps> = ({ isOpen, onClose, templateUrl }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[95vh] flex flex-col overflow-hidden relative">
        
        {/* --- HEADER --- */}
        <div className="relative bg-white border-b border-gray-100 px-6 sm:px-8 py-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 pr-8">
            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100">
              <FileText className="w-5 h-5 text-[#C8102E]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#C8102E] tracking-tight">
                DOST Project Proposal Template
              </h2>
              <p className="text-slate-500 text-xs mt-0.5 font-normal">
                DOST Form No. 1B (Preview Mode)
              </p>
            </div>
          </div>
        </div>
        
        {/* --- BODY --- */}
        <div className="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8 overflow-hidden relative">
          <div className="w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <iframe
              src={`${templatePDF}#view=FitH`}
              title="DOST Proposal Template Document"
              className="w-full h-full border-none"
            />
          </div>
        </div>
        
        {/* --- FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <a
            href={templateUrl || templateDOCX}
            download="DOST-Project-Proposal-Template.docx"
            className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Word (DOCX)
          </a>
        </div>

      </div>
    </div>
  );
};

export default TemplateViewModal;
