import React from "react";
import { FaShareAlt, FaLink, FaUserPlus, FaTimes } from 'react-icons/fa';

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

interface ShareModalProps {
  isOpen: boolean;
  project: Project | null;
  shareEmail: string;
  copied: boolean;
  onClose: () => void;
  onEmailChange: (email: string) => void;
  onCopyLink: () => void;
  onInviteEmail: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  project,
  shareEmail,
  copied,
  onClose,
  onEmailChange,
  onCopyLink,
  onInviteEmail
}) => {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-[#C8102E] to-[#E03A52] rounded-lg">
              <FaShareAlt className="text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{project.title}</h4>
              <p className="text-xs text-gray-500">Share access with team members or copy link</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-600">Project link</label>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/projects/${project.id}`}
                className="flex-1 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-700"
              />
              <button
                onClick={onCopyLink}
                className="px-3 py-2 rounded-md bg-[#C8102E] text-white text-sm hover:opacity-90 transition-opacity"
              >
                {copied ? "Copied" : <><FaLink className="inline mr-1" /> Copy</>}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Invite by email</label>
            <div className="mt-2 flex gap-2">
              <input
                value={shareEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="name@organization.com"
                className="flex-1 px-3 py-2 rounded-md border border-gray-200 text-sm"
              />
              <button
                onClick={onInviteEmail}
                className="px-3 py-2 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-[#fff5f6] transition-colors"
              >
                <FaUserPlus className="inline mr-1 text-sm" /> Invite
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Invited users will receive a link to access this project (demo).</p>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={onClose} 
              className="px-4 py-2 rounded-md bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;