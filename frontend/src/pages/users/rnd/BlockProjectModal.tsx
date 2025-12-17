// components/rnd-component/BlockProjectModal.tsx

import React, { useState } from 'react';
import { 
  X, 
  ShieldBan, 
  Ban, 
  Undo2, 
  AlertTriangle,
  UserX,
  PowerOff
} from 'lucide-react';
import { type Project } from '../admin/InterfaceProject';

interface BlockProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project | null;
}

const BlockProjectModal: React.FC<BlockProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  project
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !project) return null;

  const handleBlock = async () => {
    setIsProcessing(true);
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    onConfirm();
    setConfirmText(""); // Reset
  };

  const isConfirmDisabled = confirmText.toLowerCase() !== "block";

  return (
    // REMOVED: backdrop-blur-sm
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      {/* CHANGED: max-w-lg to max-w-2xl for wider modal */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-50 p-6 border-b border-red-100 flex justify-between items-start">
            <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/80 mb-3 text-red-700 border border-red-200 shadow-sm">
                    <ShieldBan className="w-3 h-3"/>
                    Critical Action
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-1">Block Project & Proponents</h2>
                <p className="text-xs font-medium opacity-80 text-red-800">
                    This action is irreversible and requires confirmation.
                </p>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/50 rounded-full transition-colors text-red-800"
            >
                <X className="w-6 h-6"/>
            </button>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-slate-50 space-y-6">
            
            {/* Target Project Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h5 className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Target Project</h5>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{project.title}</h3>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 border border-slate-200 mt-2 inline-block">
                        {project.projectId}
                    </span>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Budget</p>
                    <p className="text-xl font-bold text-slate-800">₱{project.budget.toLocaleString()}</p>
                </div>
            </div>

            {/* Consequences List - Grid layout for wider view */}
            <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3"/> Immediate Consequences
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Consequence 1: Shutdown - UPDATED TEXT */}
                    <div className="flex gap-3 p-4 bg-white border border-red-100 rounded-lg shadow-sm md:col-span-2">
                        <div className="p-2 bg-red-50 rounded-lg h-fit">
                            <PowerOff className="w-5 h-5 text-red-600"/>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Permanent Ban & Shutdown</p>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                If you block the users, and their proposal they cannot submit another proposal forever.
                            </p>
                        </div>
                    </div>

                    {/* Consequence 2: Proponent Blocking */}
                    <div className="flex gap-3 p-4 bg-white border border-red-100 rounded-lg shadow-sm">
                        <div className="p-2 bg-red-50 rounded-lg h-fit">
                            <UserX className="w-5 h-5 text-red-600"/>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Block Proponents</p>
                            <ul className="mt-1 space-y-1">
                                <li className="text-xs font-medium text-red-700 flex items-center gap-1">
                                    • {project.principalInvestigator} (Lead)
                                </li>
                                {project.coProponent && (
                                    <li className="text-xs font-medium text-red-700 flex items-center gap-1">
                                        • {project.coProponent} (Co-Lead)
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    {/* Consequence 3: Funds Return */}
                    <div className="flex gap-3 p-4 bg-white border border-red-100 rounded-lg shadow-sm">
                        <div className="p-2 bg-red-50 rounded-lg h-fit">
                            <Undo2 className="w-5 h-5 text-red-600"/>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">Fund Reversion</p>
                            <p className="text-xs text-slate-600 mt-1">
                                Total Budget shall be returned by the proponent immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Validation Input */}
            <div className="pt-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    To confirm this action, type <span className="font-mono font-bold text-red-600 bg-red-50 px-1 rounded">block</span> below:
                </label>
                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
                    placeholder="block"
                />
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-6 py-3 text-sm text-slate-600 hover:text-slate-800 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                disabled={isProcessing}
            >
                Cancel
            </button>
            <button
                onClick={handleBlock}
                disabled={isConfirmDisabled || isProcessing}
                className="px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
            >
                {isProcessing ? (
                    <span className="flex items-center gap-2">Processing...</span>
                ) : (
                    <>
                        <Ban className="w-4 h-4"/> Confirm Block & Shutdown
                    </>
                )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default BlockProjectModal;