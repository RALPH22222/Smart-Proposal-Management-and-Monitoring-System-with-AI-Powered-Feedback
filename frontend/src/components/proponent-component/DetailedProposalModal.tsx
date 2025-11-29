import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Target,
  Calendar,
  DollarSign,
  Phone,
  RefreshCw,
  Mail,
  MapPin,
  FileText,
  User,
  Microscope,
  Tags,
  Briefcase,
  BookOpen,
  Upload,
  Download,
  Edit,
  Eye,
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  CheckCircle
} from "lucide-react";
import type { Proposal, BudgetSource } from '../../types/proponentTypes';

interface DetailedProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onUpdateProposal?: (proposal: Proposal) => void;
}

const DetailedProposalModal: React.FC<DetailedProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  onUpdateProposal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [submittedFiles, setSubmittedFiles] = useState<string[]>([]);

  // --- Initialization Effects ---
  useEffect(() => {
    if (proposal) {
      setEditedProposal(proposal);
      if (proposal.uploadedFile) {
        setSubmittedFiles([proposal.uploadedFile]);
      }
    }
  }, [proposal]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setNewFile(null);
    }
  }, [isOpen]);

  if (!isOpen || !proposal || !editedProposal) {
    return null;
  }

  // --- Logic Handlers ---
  const handleInputChange = (field: keyof Proposal, value: string) => {
    setEditedProposal({ ...editedProposal, [field]: value });
  };

  const handleBudgetChange = (index: number, field: keyof BudgetSource, value: string) => {
    const updatedBudgetSources = [...editedProposal.budgetSources];
    updatedBudgetSources[index] = { ...updatedBudgetSources[index], [field]: value };
    setEditedProposal({ ...editedProposal, budgetSources: updatedBudgetSources });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setNewFile(file);
  };

  const handleSave = () => {
    if (onUpdateProposal) {
      const newFileUrl = newFile ? URL.createObjectURL(newFile) : editedProposal.uploadedFile;
      if (newFileUrl && !submittedFiles.includes(newFileUrl)) {
        setSubmittedFiles(prev => [...prev, newFileUrl]);
      }
      const updatedProposal: Proposal = {
        ...(editedProposal as Proposal),
        uploadedFile: newFileUrl,
        status: 'r&d evaluation',
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      onUpdateProposal(updatedProposal);
      setIsEditing(false);
      setNewFile(null);
    }
  };

  const handleCancel = () => {
    setEditedProposal(proposal);
    setNewFile(null);
    setIsEditing(false);
  };

  // --- Helper Variables ---
  const currentData = isEditing ? editedProposal : proposal;
  const canEdit = proposal.status === 'revise' && isEditing;
  const isFunded = proposal.status === 'funded';

  // --- Design Helpers ---
  const getStatusTheme = (status: string) => {
    const s = status.toLowerCase();
    if (['pending'].includes(s)) {
      return {
        bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800',
        icon: <Clock className="w-5 h-5 text-yellow-600" />, label: 'Pending'
      };
    }
    if (['funded', 'accepted', 'approved'].includes(s)) {
      return {
        bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800',
        icon: <CheckCircle className="w-5 h-5 text-emerald-600" />, label: 'Project Funded'
      };
    }
    if (['rejected', 'disapproved', 'reject'].includes(s)) {
      return {
        bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
        icon: <XCircle className="w-5 h-5 text-red-600" />, label: 'Proposal Rejected'
      };
    }
    if (['revise', 'revision'].includes(s)) {
      return {
        bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800',
        icon: <RefreshCw className="w-5 h-5 text-orange-600" />, label: 'Revision Required'
      };
    }
    if (['r&d evaluation'].includes(s)) {
      return {
        bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800',
        icon: <Microscope className="w-5 h-5 text-blue-600" />, label: 'Under R&D Evaluation'
      }
    }
       if (['evaluators assessment'].includes(s)) {
      return {
        bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800',
        icon: <FileCheck className="w-5 h-5 text-purple-600" />, label: 'Under Evaluators Assessment'
      }
    }

    return {
      bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700',
      icon: <Clock className="w-5 h-5 text-slate-500" />, label: 'Under Evaluation'
    };
  };

  const theme = getStatusTheme(proposal.status);

  // --- Input Field Renderers ---
  const getInputClass = (editable: boolean) => {
    return editable 
      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E] shadow-sm' 
      : 'bg-transparent border-transparent text-slate-900 font-medium px-0';
  };

  const renderFundedField = (content: React.ReactNode) => {
    if (isFunded && !isEditing) {
      return (
        <div className="relative group">
          {content}
          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      );
    }
    return content;
  };

  // --- Comments Data ---
  const reviseComments = [
    { section: "Methodology", comment: "The proposed methodology lacks sufficient detail in implementation approach." },
    { section: "Budget", comment: "Some line items require better justification and cost-benefit analysis." },
    { section: "Overall", comment: "Project shows promise but requires moderate revisions before proceeding." }
  ];
  const rejectComments = [
    { section: "Reason for Rejection", comment: "Project objectives do not align with current organizational priorities." }
  ];
  const activeComments = proposal.status === 'revise' ? reviseComments : proposal.status === 'reject' ? rejectComments : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-gray-100 bg-white gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.bg} ${theme.border} ${theme.text}`}>
                {theme.icon}
                {theme.label}
              </span>
              <span className="text-xs text-slate-500 font-normal">DOST Form No. 1B</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight truncate pr-4">
              {currentData.title}
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Edit Toggle Button */}
            {proposal.status === 'revise' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isEditing 
                    ? 'bg-slate-100 text-slate-700 border border-slate-300' 
                    : 'bg-[#C8102E] text-white shadow-sm hover:bg-[#a00c24]'
                }`}
              >
                {isEditing ? <Eye className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                {isEditing ? 'Preview Mode' : 'Edit Proposal'}
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Revision Deadline Banner */}
        {proposal.status === 'revise' && (
          <div className="flex items-center gap-2 text-sm font-medium text-orange-800 bg-orange-100/50 px-3 py-2 border border-orange-200">
            <RefreshCw className="w-4 h-4" />
            Deadline for Revision: {proposal.deadline || '2024-12-31 23:59'}
          </div>
        )}
        {/* --- BODY --- */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {/* 1. Status Banner & Comments */}
          {(proposal.status === 'revise' || proposal.status === 'reject') && (
            <div className={`rounded-xl p-5 border ${theme.bg} ${theme.border}`}>
              <h3 className={`text-sm font-bold ${theme.text} mb-3 flex items-center gap-2`}>
                {theme.icon} R&D Staff Feedback
              </h3>
              <div className="grid gap-3">
                {activeComments.map((c, i) => (
                  <div key={i} className="bg-white/60 rounded-lg p-3 border border-white/50">
                    <span className={`text-xs font-bold  tracking-wider block mb-1 opacity-75 ${theme.text}`}>
                      {c.section}
                    </span>
                    <p className={`text-sm leading-relaxed ${theme.text}`}>{c.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. File Management Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C8102E]" /> Project Documents
              </h3>
              {submittedFiles.length > 1 && (
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                  v{submittedFiles.length}
                </span>
              )}
            </div>

            {/* File Actions */}
            <div className="flex flex-col gap-3">
              {/* Current File Display */}
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 group hover:border-[#C8102E] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-[#C8102E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {submittedFiles.length > 0 ? 'Current Proposal PDF' : 'No file uploaded'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {submittedFiles.length > 0 ? 'Latest version' : 'Pending upload'}
                    </p>
                  </div>
                </div>
                {submittedFiles.length > 0 && (
                  <button 
                    onClick={() => window.open(submittedFiles[submittedFiles.length - 1], '_blank')}
                    className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload New File (Only in Edit Mode) */}
              {canEdit && (
                <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${newFile ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-[#C8102E] hover:bg-white'}`}>
                  {!newFile ? (
                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">Click to upload revised PDF</span>
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Ready to submit</p>
                          <p className="text-xs text-green-600 max-w-[200px] truncate">{newFile.name}</p>
                        </div>
                      </div>
                      <button onClick={() => setNewFile(null)} className="text-xs text-red-600 hover:underline font-medium">Remove</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 3. Proponent & Agency Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Proponent Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#C8102E]" /> Proponent Details
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500   font-bold tracking-wider">Name</label>
                  <div className="mt-1">
                    {canEdit ? (
                      <input 
                        type="text" 
                        value={currentData.proponent} 
                        onChange={(e) => handleInputChange('proponent', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                      />
                    ) : (
                      renderFundedField(<p className="text-sm font-medium text-slate-900">{currentData.proponent}</p>)
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500  font-bold tracking-wider">Gender</label>
                    <div className="mt-1">
                      {canEdit ? (
                        <select 
                          value={currentData.gender} 
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      ) : (
                        renderFundedField(<p className="text-sm text-slate-900">{currentData.gender}</p>)
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold tracking-wider">Phone</label>
                    <div className="mt-1 flex items-center gap-2">
                      {!canEdit && <Phone className="w-3.5 h-3.5 text-slate-400" />}
                      {canEdit ? (
                        <input 
                          type="text" 
                          value={currentData.telephone} 
                          onChange={(e) => handleInputChange('telephone', e.target.value)}
                          className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                        />
                      ) : (
                        renderFundedField(<p className="text-sm text-slate-900">{currentData.telephone}</p>)
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold tracking-wider">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    {!canEdit && <Mail className="w-3.5 h-3.5 text-slate-400" />}
                    {canEdit ? (
                      <input 
                        type="email" 
                        value={currentData.email} 
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                      />
                    ) : (
                      renderFundedField(<p className="text-sm text-slate-900">{currentData.email}</p>)
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Agency Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C8102E]" /> Agency Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 font-bold tracking-wider">Agency</label>
                  <div className="mt-1">
                    {canEdit ? (
                      <input 
                        type="text" 
                        value={currentData.agency} 
                        onChange={(e) => handleInputChange('agency', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                      />
                    ) : (
                      renderFundedField(<p className="text-sm font-medium text-slate-900">{currentData.agency}</p>)
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold tracking-wider">Address</label>
                  <div className="mt-1">
                    {canEdit ? (
                      <textarea 
                        value={currentData.address} 
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                      />
                    ) : (
                      renderFundedField(
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-900">{currentData.address}</p>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold tracking-wider">Cooperating Agencies</label>
                  <div className="mt-1">
                    {canEdit ? (
                      <input 
                        type="text" 
                        value={currentData.cooperatingAgencies} 
                        onChange={(e) => handleInputChange('cooperatingAgencies', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${getInputClass(true)}`}
                      />
                    ) : (
                      renderFundedField(<p className="text-sm text-slate-900">{currentData.cooperatingAgencies}</p>)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Project Details Grid */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {/* Helper to render grid items */}
              {[
                { label: 'Sector', icon: Briefcase, field: 'sector' },
                { label: 'Discipline', icon: BookOpen, field: 'discipline' },
                { label: 'Priority Area', icon: Target, field: 'priorityAreas' },
                { label: 'Research & Development Station', icon: Microscope, field: 'rdStation' },
                { label: 'Mode of Implementation', icon: FileText, field: 'modeOfImplementation' },
                { label: 'Classification', icon: Tags, field: 'classification' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 tracking-wider">{item.label}</span>
                  </div>
                  {canEdit ? (
                    <input 
                      type="text" 
                      value={(currentData as any)[item.field]} 
                      onChange={(e) => handleInputChange(item.field as keyof Proposal, e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-md border text-sm ${getInputClass(true)}`}
                    />
                  ) : (
                    renderFundedField(<p className="text-sm font-medium text-slate-900 pl-5">{(currentData as any)[item.field]}</p>)
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Schedule & Budget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8102E]" /> Schedule
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Duration</p>
                  {canEdit ? (
                    <input type="text" value={currentData.duration} onChange={(e)=>handleInputChange('duration', e.target.value)} className={`w-full px-2 py-1 text-sm border rounded ${getInputClass(true)}`} />
                  ) : renderFundedField(<p className="text-sm font-semibold text-slate-900">{currentData.duration}</p>)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Start</p>
                    {canEdit ? (
                      <input type="date" value={currentData.startDate} onChange={(e)=>handleInputChange('startDate', e.target.value)} className={`w-full px-2 py-1 text-sm border rounded ${getInputClass(true)}`} />
                    ) : renderFundedField(<p className="text-sm font-medium text-slate-700">{currentData.startDate}</p>)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">End</p>
                    {canEdit ? (
                      <input type="date" value={currentData.endDate} onChange={(e)=>handleInputChange('endDate', e.target.value)} className={`w-full px-2 py-1 text-sm border rounded ${getInputClass(true)}`} />
                    ) : renderFundedField(<p className="text-sm font-medium text-slate-700">{currentData.endDate}</p>)}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8102E]" /> Budget Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Source</th>
                      <th className="px-3 py-2 text-right">PS</th>
                      <th className="px-3 py-2 text-right">MOOE</th>
                      <th className="px-3 py-2 text-right">CO</th>
                      <th className="px-3 py-2 text-right font-bold text-slate-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentData.budgetSources.map((budget, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors group">
                        {['source', 'ps', 'mooe', 'co', 'total'].map((key) => (
                          <td key={key} className={`px-3 py-2 ${key !== 'source' ? 'text-right' : ''}`}>
                            {canEdit ? (
                              <input 
                                type="text" 
                                value={(budget as any)[key]} 
                                onChange={(e) => handleBudgetChange(index, key as keyof BudgetSource, e.target.value)}
                                className={`w-full px-2 py-1 text-xs border rounded ${getInputClass(true)} ${key !== 'source' ? 'text-right' : ''}`}
                              />
                            ) : (
                              renderFundedField(
                                <span className={`text-xs font-medium ${key === 'total' ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                  {(budget as any)[key]}
                                </span>
                              )
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td className="px-3 py-2 font-bold text-slate-900 text-xs">GRAND TOTAL</td>
                      <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#C8102E] text-sm">
                        {renderFundedField(currentData.budgetTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {isEditing ? "Editing Mode Active" : "Read-Only View"}
          </span>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] border border-[#C8102E] rounded-lg hover:bg-[#a00c24] transition-colors shadow-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Submit Revision
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetailedProposalModal;