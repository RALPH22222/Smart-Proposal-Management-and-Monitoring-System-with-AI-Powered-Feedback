import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, Upload, X } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  fetchTerminalReport,
  submitTerminalReport,
  uploadReportFile,
  validateReportFile,
  REPORT_ALLOWED_EXTENSIONS,
  type ApiTerminalReport,
} from '../../services/ProjectMonitoringApi';

interface Props {
  fundedProjectId: number;
  allQuartersVerified: boolean;
  // When truthy, submit is blocked because the project is missing DOST Form 4 / Form 5.
  // The parent passes the human-readable list; we use it for the tooltip. The parent
  // also renders the full banner above the quarters, so we only need a short inline hint.
  missingComplianceDocs?: string[];
}

export default function TerminalReportSection({ fundedProjectId, allQuartersVerified, missingComplianceDocs = [] }: Props) {
  const complianceBlocked = missingComplianceDocs.length > 0;
  const [terminalReport, setTerminalReport] = useState<ApiTerminalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [accomplishments, setAccomplishments] = useState('');
  const [outputsPublications, setOutputsPublications] = useState('');
  const [outputsPatentsIp, setOutputsPatentsIp] = useState('');
  const [outputsProducts, setOutputsProducts] = useState('');
  const [outputsPeople, setOutputsPeople] = useState('');
  const [outputsPartnerships, setOutputsPartnerships] = useState('');
  const [outputsPolicy, setOutputsPolicy] = useState('');
  const [problemsEncountered, setProblemsEncountered] = useState('');
  const [suggestedSolutions, setSuggestedSolutions] = useState('');
  const [publicationsList, setPublicationsList] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!allQuartersVerified) {
      setLoading(false);
      return;
    }
    fetchTerminalReport(fundedProjectId)
      .then((data) => setTerminalReport(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fundedProjectId, allQuartersVerified]);

  if (!allQuartersVerified || loading) return null;

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    for (const f of newFiles) {
      const err = validateReportFile(f);
      if (err) {
        Swal.fire('Invalid File', err, 'error');
        return;
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!accomplishments.trim()) {
      Swal.fire('Required', 'Accomplishments field is required.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // Upload files first
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadReportFile(file);
        uploadedUrls.push(url);
      }

      const result = await submitTerminalReport({
        fundedProjectId,
        actualStartDate: actualStartDate || undefined,
        actualEndDate: actualEndDate || undefined,
        accomplishments,
        outputsPublications: outputsPublications || undefined,
        outputsPatentsIp: outputsPatentsIp || undefined,
        outputsProducts: outputsProducts || undefined,
        outputsPeople: outputsPeople || undefined,
        outputsPartnerships: outputsPartnerships || undefined,
        outputsPolicy: outputsPolicy || undefined,
        problemsEncountered: problemsEncountered || undefined,
        suggestedSolutions: suggestedSolutions || undefined,
        publicationsList: publicationsList || undefined,
        reportFileUrl: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });

      setTerminalReport(result);
      setShowForm(false);
      Swal.fire('Submitted', 'Terminal report submitted successfully.', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit terminal report.';
      Swal.fire('Error', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Already submitted — show status
  if (terminalReport) {
    const isVerified = terminalReport.status === 'verified';
    return (
      <div className={`rounded-2xl border-2 p-6 ${isVerified ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-3 mb-4">
          {isVerified ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600" />
          )}
          <h3 className="text-lg font-bold text-gray-800">
            Terminal Report {isVerified ? '— Verified' : '— Pending Verification'}
          </h3>
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          {terminalReport.actual_start_date && (
            <p><span className="font-semibold">Actual Duration:</span> {terminalReport.actual_start_date} to {terminalReport.actual_end_date}</p>
          )}
          <div>
            <p className="font-semibold mb-1">Accomplishments Against Objectives:</p>
            <p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.accomplishments}</p>
          </div>

          {/* 6Ps Section */}
          {(terminalReport.outputs_publications || terminalReport.outputs_patents_ip || terminalReport.outputs_products || terminalReport.outputs_people || terminalReport.outputs_partnerships || terminalReport.outputs_policy) && (
            <div>
              <p className="font-semibold mb-2">Outputs (6Ps):</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {terminalReport.outputs_publications && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Publications</span><p className="mt-1">{terminalReport.outputs_publications}</p></div>}
                {terminalReport.outputs_patents_ip && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Patents/IP</span><p className="mt-1">{terminalReport.outputs_patents_ip}</p></div>}
                {terminalReport.outputs_products && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Products</span><p className="mt-1">{terminalReport.outputs_products}</p></div>}
                {terminalReport.outputs_people && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">People Services</span><p className="mt-1">{terminalReport.outputs_people}</p></div>}
                {terminalReport.outputs_partnerships && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Places & Partnerships</span><p className="mt-1">{terminalReport.outputs_partnerships}</p></div>}
                {terminalReport.outputs_policy && <div className="bg-white/60 rounded-lg p-2"><span className="font-medium text-xs uppercase text-gray-500">Policy</span><p className="mt-1">{terminalReport.outputs_policy}</p></div>}
              </div>
            </div>
          )}

          {terminalReport.problems_encountered && (
            <div><p className="font-semibold mb-1">Problems Encountered:</p><p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.problems_encountered}</p></div>
          )}
          {terminalReport.suggested_solutions && (
            <div><p className="font-semibold mb-1">Suggested Solutions:</p><p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.suggested_solutions}</p></div>
          )}
          {terminalReport.publications_list && (
            <div><p className="font-semibold mb-1">Publications List:</p><p className="whitespace-pre-wrap bg-white/60 rounded-lg p-3">{terminalReport.publications_list}</p></div>
          )}
        </div>

        {isVerified && terminalReport.verified_by_user && (
          <p className="mt-4 text-xs text-green-700">
            Verified by {terminalReport.verified_by_user.first_name} {terminalReport.verified_by_user.last_name} on {new Date(terminalReport.verified_at!).toLocaleDateString()}
          </p>
        )}
      </div>
    );
  }

  // Not yet submitted — show form or prompt
  if (!showForm) {
    return (
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Terminal Report Required</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          All quarterly reports have been verified. Please submit a terminal report (DOST Form 9A) before a completion certificate can be issued.
        </p>
        <button
          onClick={() => setShowForm(true)}
          disabled={complianceBlocked}
          title={complianceBlocked ? `Upload required first: ${missingComplianceDocs.join(', ')}` : undefined}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm"
        >
          {complianceBlocked ? 'Submit Terminal Report (DOST docs required)' : 'Submit Terminal Report'}
        </button>
      </div>
    );
  }

  // Form
  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Terminal Report (DOST Form 9A)</h3>
        </div>
        <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Actual Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Actual Start Date</label>
            <input type="date" value={actualStartDate} onChange={(e) => setActualStartDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Actual End Date</label>
            <input type="date" value={actualEndDate} onChange={(e) => setActualEndDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Accomplishments */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Accomplishments Against Objectives <span className="text-red-500">*</span></label>
          <textarea value={accomplishments} onChange={(e) => setAccomplishments(e.target.value)} placeholder="Describe accomplishments relative to stated objectives..." className="w-full p-3 border border-gray-300 rounded-xl text-sm h-28 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {/* 6Ps Outputs */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Outputs — 6Ps (DOST Impact Metrics)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Publications</label>
              <textarea value={outputsPublications} onChange={(e) => setOutputsPublications(e.target.value)} placeholder="Papers, articles, proceedings..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Patents / Intellectual Property</label>
              <textarea value={outputsPatentsIp} onChange={(e) => setOutputsPatentsIp(e.target.value)} placeholder="Patents filed, utility models..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Products</label>
              <textarea value={outputsProducts} onChange={(e) => setOutputsProducts(e.target.value)} placeholder="Technologies, prototypes, tools..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">People Services</label>
              <textarea value={outputsPeople} onChange={(e) => setOutputsPeople(e.target.value)} placeholder="Training, capacity building, HR..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Places & Partnerships</label>
              <textarea value={outputsPartnerships} onChange={(e) => setOutputsPartnerships(e.target.value)} placeholder="Collaborations, community impact..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Policy</label>
              <textarea value={outputsPolicy} onChange={(e) => setOutputsPolicy(e.target.value)} placeholder="Policy recommendations, frameworks..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Problems & Solutions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Problems Encountered</label>
            <textarea value={problemsEncountered} onChange={(e) => setProblemsEncountered(e.target.value)} placeholder="Challenges during implementation..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Suggested Solutions</label>
            <textarea value={suggestedSolutions} onChange={(e) => setSuggestedSolutions(e.target.value)} placeholder="Recommendations for future..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>

        {/* Publications List */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Publications List</label>
          <textarea value={publicationsList} onChange={(e) => setPublicationsList(e.target.value)} placeholder="List all resulting publications with full citations..." className="w-full p-2.5 border border-gray-300 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Supporting Documents</label>
          <div className="flex items-center gap-2 flex-wrap">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full">
                {f.name}
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <label className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-full cursor-pointer transition-colors">
              <Upload className="w-3 h-3" /> Add File
              <input type="file" className="hidden" accept={REPORT_ALLOWED_EXTENSIONS} onChange={handleFileAdd} multiple />
            </label>
          </div>
        </div>

        {/* Submit — also blocked when MOA / Agency Cert missing. */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !accomplishments.trim() || complianceBlocked}
          title={complianceBlocked ? `Upload required first: ${missingComplianceDocs.join(', ')}` : undefined}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
        >
          {submitting
            ? 'Submitting...'
            : complianceBlocked
              ? 'Submit Terminal Report (DOST docs required)'
              : 'Submit Terminal Report'}
        </button>
      </div>
    </div>
  );
}
