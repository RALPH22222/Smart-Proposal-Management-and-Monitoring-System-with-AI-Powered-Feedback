import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Users,
  Target,
  Calendar,
  DollarSign,
  Phone,
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
  CheckCircle2
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

  // Initialize edited proposal when modal opens or proposal changes
  useEffect(() => {
    if (proposal) {
      setEditedProposal(proposal);
      // Initialize submitted files with the original uploaded file
      if (proposal.uploadedFile) {
        setSubmittedFiles([proposal.uploadedFile]);
      }
    }
  }, [proposal]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setNewFile(null);
    }
  }, [isOpen]);

  // Early return only after all hooks have been called
  if (!isOpen || !proposal || !editedProposal) {
    return null;
  }

  const handleInputChange = (field: keyof Proposal, value: string) => {
    setEditedProposal({
      ...editedProposal,
      [field]: value
    });
  };

  const handleBudgetChange = (index: number, field: keyof BudgetSource, value: string) => {
    const updatedBudgetSources = [...editedProposal.budgetSources];
    updatedBudgetSources[index] = {
      ...updatedBudgetSources[index],
      [field]: value
    };
    setEditedProposal({
      ...editedProposal,
      budgetSources: updatedBudgetSources
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewFile(file);
    }
  };

  const handleSave = () => {
    if (onUpdateProposal) {
      // Create a new file URL if a new file was uploaded
      const newFileUrl = newFile ? URL.createObjectURL(newFile) : editedProposal.uploadedFile;
      
      // Add the new file to submitted files
      if (newFileUrl && !submittedFiles.includes(newFileUrl)) {
        setSubmittedFiles(prev => [...prev, newFileUrl]);
      }
      
      const updatedProposal = {
        ...editedProposal,
        uploadedFile: newFileUrl,
        status: 'r&d Evaluation', // Change back to r&d review after revision
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      // onUpdateProposal(updatedProposal);
      setIsEditing(false);
      setNewFile(null);
    }
  };

  const handleCancel = () => {
    setEditedProposal(proposal);
    setNewFile(null);
    setIsEditing(false);
  };

  const currentData = isEditing ? editedProposal : proposal;
  const canEdit = proposal.status === 'revise' && isEditing;
  const isFunded = proposal.status === 'funded';

  // Comments data based on status
  const reviseComments = [
    {
      section: "Methodology Assessment",
      comment: "The proposed methodology is adequate but lacks sufficient detail in implementation approach and requires clearer documentation of research procedures and data analysis methods."
    },
    {
      section: "Budget Assessment",
      comment: "Budget allocation is generally reasonable but some line items require better justification and more detailed cost-benefit analysis for equipment and personnel expenses."
    },
    {
      section: "Timeline Assessment",
      comment: "Project timeline is generally feasible but requires adjustments for certain phases and better risk mitigation planning for potential delays."
    },
    {
      section: "Overall Assessment",
      comment: "Project shows promise but requires moderate revisions across multiple assessment areas before it can proceed to the next evaluation stage."
    }
  ];

  const rejectComments = [
    {
      section: "Reason for Rejection",
      comment: "Project objectives do not align with current organizational priorities and strategic goals. The proposed methodology lacks scientific rigor and sufficient detail, and the budget allocation significantly exceeds available funding limits without proper justification."
    }
  ];

  const currentComments = proposal.status === 'revise' ? reviseComments : 
                         proposal.status === 'reject' ? rejectComments : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'r&D Evaluation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'revise': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reject': return 'bg-red-100 text-red-800 border-red-200';
      case 'funded': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInputClass = (canEdit: boolean) => {
    return canEdit 
      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#C8102E] focus:ring-1 focus:ring-[#C8102E]' 
      : 'bg-slate-50 border-slate-200 text-slate-700';
  };

  // Function to render input field with check icon for funded status
  const renderFundedField = (content: React.ReactNode, fieldName?: string) => {
    if (isFunded && !isEditing) {
      return (
        <div className="relative">
          {content}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      );
    }
    return content;
  };

  // Function to render text area with check icon for funded status
  const renderFundedTextArea = (content: React.ReactNode) => {
    if (isFunded && !isEditing) {
      return (
        <div className="relative">
          {content}
          <div className="absolute right-3 top-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      );
    }
    return content;
  };

  // Function to render budget table cell with check icon for funded status
  const renderFundedTableCell = (content: React.ReactNode, isLastCell = false) => {
    if (isFunded && !isEditing) {
      return (
        <div className="relative">
          {content}
          {isLastCell && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          )}
        </div>
      );
    }
    return content;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {currentData.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              DOST Form No. 1B - Capsule R&D Proposal
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* File Upload/Download Section */}
            <div className="flex items-center gap-2 mr-4">
              {submittedFiles.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => window.open(submittedFiles[submittedFiles.length - 1], '_blank')}
                    className="flex items-center gap-1 px-3 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Current File
                  </button>
                  {submittedFiles.length > 1 && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      +{submittedFiles.length - 1} previous
                    </span>
                  )}
                </div>
              )}
              {canEdit && (
                <label className="flex items-center gap-1 px-3 py-2 text-xs bg-[#C8102E] text-white rounded-lg hover:bg-[#a50e26] transition-colors cursor-pointer">
                  <Upload className="w-3 h-3" />
                  Upload Revised File
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Edit/View Toggle */}
            {proposal.status === 'revise' && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                  isEditing 
                    ? 'bg-white text-gray-800 hover:bg-slate-100 border border-slate-400' 
                    : 'bg-white text-gray-800 border border-slate-400 hover:bg-slate-100'
                }`}
              >
                {isEditing ? <Eye className="w-3 h-3" /> : <Edit className="w-3 h-3" />}
                {isEditing ? 'View' : 'Edit'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {proposal.status === 'revise' && (
            <div className="flex items-center gap-1 text-sm text-amber-600 font-medium bg-amber-50 px-3 py-2 border border-amber-200">
              <Calendar className="w-4 h-4" />
              Deadline: {proposal.deadline || '2024-12-31 23:59'}
            </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                  {canEdit ? (
                    <input
                      type="text"
                      value={currentData.proponent}
                      onChange={(e) => handleInputChange('proponent', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <p className="font-semibold text-slate-900 text-sm relative">
                        {currentData.proponent}
                      </p>
                    )
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Gender
                  </span>
                  {canEdit ? (
                    <select
                      value={currentData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    renderFundedField(
                      <p className="font-medium text-slate-900 text-sm">
                        {currentData.gender}
                      </p>
                    )
                  )}
                </div>
              </div>

              {/* Agency & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Agency
                  </span>
                  {canEdit ? (
                    <input
                      type="text"
                      value={currentData.agency}
                      onChange={(e) => handleInputChange('agency', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <div className="flex items-start gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        <p className="font-medium text-slate-900 text-sm">
                          {currentData.agency}
                        </p>
                      </div>
                    )
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Address
                  </span>
                  {canEdit ? (
                    <textarea
                      value={currentData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                      rows={2}
                    />
                  ) : (
                    renderFundedTextArea(
                      <div className="flex items-start gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                        <p className="text-slate-900 text-sm">{currentData.address}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs text-slate-500">Telephone</span>
                  {canEdit ? (
                    <input
                      type="text"
                      value={currentData.telephone}
                      onChange={(e) => handleInputChange('telephone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <p className="text-sm text-slate-900">
                          {currentData.telephone}
                        </p>
                      </div>
                    )
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-500">Email</span>
                  {canEdit ? (
                    <input
                      type="email"
                      value={currentData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <p className="text-sm text-slate-900">{currentData.email}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 2. Cooperating Agencies */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C8102E]" />
                Cooperating Agencies
              </h3>
              {canEdit ? (
                <textarea
                  value={currentData.cooperatingAgencies}
                  onChange={(e) => handleInputChange('cooperatingAgencies', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                  rows={3}
                />
              ) : (
                renderFundedTextArea(
                  <p className="text-xs sm:text-sm text-slate-700">
                    {currentData.cooperatingAgencies}
                  </p>
                )
              )}
            </div>

            {/* R&D Station & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-[#C8102E]" />
                  Research & Development Station
                </h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentData.rdStation}
                    onChange={(e) => handleInputChange('rdStation', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                  />
                ) : (
                  renderFundedField(
                    <p className="text-xs sm:text-sm text-slate-700">
                      {currentData.rdStation}
                    </p>
                  )
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-[#C8102E]" />
                  Classification
                </h3>
                {canEdit ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={currentData.classification}
                      onChange={(e) => handleInputChange('classification', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                      placeholder="Classification"
                    />
                    <input
                      type="text"
                      value={currentData.classificationDetails}
                      onChange={(e) => handleInputChange('classificationDetails', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                      placeholder="Classification Details"
                    />
                  </div>
                ) : (
                  renderFundedField(
                    <p className="text-xs sm:text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        {currentData.classification}: 
                      </span>{" "}
                      {currentData.classificationDetails}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Mode & Priority Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" />
                  Mode of Implementation
                </h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentData.modeOfImplementation}
                    onChange={(e) => handleInputChange('modeOfImplementation', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                  />
                ) : (
                  renderFundedField(
                    <p className="text-xs sm:text-sm text-slate-700">
                      {currentData.modeOfImplementation}
                    </p>
                  )
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#C8102E]" />
                  Priority Areas
                </h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentData.priorityAreas}
                    onChange={(e) => handleInputChange('priorityAreas', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                  />
                ) : (
                  renderFundedField(
                    <p className="text-xs sm:text-sm text-slate-700">
                      {currentData.priorityAreas}
                    </p>
                  )
                )}
              </div>
            </div>

            {/* Sector & Discipline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#C8102E]" />
                  Sector/Commodity
                </h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                  />
                ) : (
                  renderFundedField(
                    <p className="text-xs sm:text-sm text-slate-700">
                      {currentData.sector}
                    </p>
                  )
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#C8102E]" />
                  Discipline
                </h3>
                {canEdit ? (
                  <input
                    type="text"
                    value={currentData.discipline}
                    onChange={(e) => handleInputChange('discipline', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${getInputClass(canEdit)}`}
                  />
                ) : (
                  renderFundedField(
                    <p className="text-xs sm:text-sm text-slate-700">
                      {currentData.discipline}
                    </p>
                  )
                )}
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
                  {canEdit ? (
                    <input
                      type="text"
                      value={currentData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <p className="font-semibold text-slate-900 mt-1">
                        {currentData.duration}
                      </p>
                    )
                  )}
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">
                    Start Date
                  </span>
                  {canEdit ? (
                    <input
                      type="date"
                      value={currentData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <p className="font-semibold text-slate-900 mt-1">
                        {currentData.startDate}
                      </p>
                    )
                  )}
                </div>
                <div>
                  <span className="text-slate-500 text-xs uppercase tracking-wide">
                    End Date
                  </span>
                  {canEdit ? (
                    <input
                      type="date"
                      value={currentData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm mt-1 ${getInputClass(canEdit)}`}
                    />
                  ) : (
                    renderFundedField(
                      <p className="font-semibold text-slate-900 mt-1">
                        {currentData.endDate}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Budget Table */}
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
                    {currentData.budgetSources.map((budget, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="border-b border-r border-slate-300 px-3 py-2 font-medium text-slate-800">
                          {canEdit ? (
                            <input
                              type="text"
                              value={budget.source}
                              onChange={(e) => handleBudgetChange(index, 'source', e.target.value)}
                              className={`w-full px-2 py-1 border rounded ${getInputClass(canEdit)}`}
                            />
                          ) : (
                            renderFundedTableCell(budget.source)
                          )}
                        </td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                          {canEdit ? (
                            <input
                              type="text"
                              value={budget.ps}
                              onChange={(e) => handleBudgetChange(index, 'ps', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-right ${getInputClass(canEdit)}`}
                            />
                          ) : (
                            renderFundedTableCell(budget.ps)
                          )}
                        </td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                          {canEdit ? (
                            <input
                              type="text"
                              value={budget.mooe}
                              onChange={(e) => handleBudgetChange(index, 'mooe', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-right ${getInputClass(canEdit)}`}
                            />
                          ) : (
                            renderFundedTableCell(budget.mooe)
                          )}
                        </td>
                        <td className="border-b border-r border-slate-300 px-3 py-2 text-right text-slate-700">
                          {canEdit ? (
                            <input
                              type="text"
                              value={budget.co}
                              onChange={(e) => handleBudgetChange(index, 'co', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-right ${getInputClass(canEdit)}`}
                            />
                          ) : (
                            renderFundedTableCell(budget.co)
                          )}
                        </td>
                        <td className="border-b border-slate-300 px-3 py-2 text-right font-semibold text-slate-800">
                          {canEdit ? (
                            <input
                              type="text"
                              value={budget.total}
                              onChange={(e) => handleBudgetChange(index, 'total', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-right ${getInputClass(canEdit)}`}
                            />
                          ) : (
                            renderFundedTableCell(budget.total, true)
                          )}
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
                      <td className="px-3 py-2 text-right text-[#C8102E] text-sm relative">
                        {currentData.budgetTotal}
                        {isFunded && !isEditing && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                        )}
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

            {/* R&D Assessment Comments - Only show for revise or reject status */}
            {(proposal.status === 'revise' || proposal.status === 'reject') && (
              <div className={`rounded-lg p-4 border ${
                proposal.status === 'revise' 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-[#C8102E]" />
                  R&D Assessment Comments
                </h3>
                
                <div className="space-y-4">
                  {currentComments.map((comment, index) => (
                    <div key={index} className="bg-white rounded-lg border border-slate-200 p-4">
                      <h4 className="font-semibold text-slate-800 text-sm mb-2">
                        {comment.section}
                      </h4>
                      <p className="text-sm text-slate-700">
                        {comment.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Additional guidance based on status */}
                {proposal.status === 'revise' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 text-sm mb-2">Revision Instructions</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Please address all the comments above and upload your revised PDF. The original PDF will be kept for reference.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <FileCheck className="w-4 h-4" />
                      <span>Upload revised PDF using the "Upload Revised PDF" button above</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submitted Files History */}
            {submittedFiles.length > 1 && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#C8102E]" />
                  Submitted Files History
                </h3>
                <div className="space-y-2">
                  {submittedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {index === submittedFiles.length - 1 ? 'Current Version' : `Version ${submittedFiles.length - index}`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {index === submittedFiles.length - 1 ? 'Latest submission' : 'Previous submission'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(file, '_blank')}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload Status */}
            {newFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Revised PDF Ready to Submit</p>
                    <p className="text-xs text-green-600">{newFile.name}</p>
                  </div>
                  <button
                    onClick={() => setNewFile(null)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {isEditing ? 'Editing mode: You can modify the proposal details' : 'View mode: Read-only view'}
            {isFunded && !isEditing && ' • All fields have been funded'}
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#C8102E] border border-[#C8102E] rounded-lg hover:bg-[#a50e26] transition-colors"
                >
                  Submit Revision
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
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