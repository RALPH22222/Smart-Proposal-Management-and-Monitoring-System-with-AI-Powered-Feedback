import { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle2, Loader2, Clock, XCircle, ShieldCheck } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  uploadProjectDocument,
  validateReportFile,
  type ComplianceDocStatus,
} from '../../services/ProjectMonitoringApi';
import { openSignedUrl } from '../../utils/signed-url';
import { getFileActionMeta } from '../shared/FileActionButton';

interface ProjectDocumentsSectionProps {
  fundedProjectId: number;
  moaFileUrl: string | null;
  agencyCertFileUrl: string | null;
  workPlanFileUrl: string | null;
  moaStatus: ComplianceDocStatus;
  moaReviewNote: string | null;
  moaVerifiedAt: string | null;
  agencyCertStatus: ComplianceDocStatus;
  agencyCertReviewNote: string | null;
  agencyCertVerifiedAt: string | null;
  onDocumentChanged?: () => void;
}

type DocKey = 'moa' | 'agency_certification';

const DOCUMENTS: { key: DocKey; label: string; formLabel: string; description: string }[] = [
  {
    key: 'moa',
    label: 'Memorandum of Agreement',
    formLabel: 'DOST Form 5',
    description: 'Agreement between DOST and implementing agency',
  },
  {
    key: 'agency_certification',
    label: 'Certification of Agency Funding',
    formLabel: 'DOST Form 4',
    description: 'Agency certification of matching/counterpart funds',
  },
];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function StatusBadge({ status }: { status: ComplianceDocStatus }) {
  const config: Record<ComplianceDocStatus, { bg: string; text: string; icon: typeof Clock; label: string }> = {
    not_uploaded: { bg: 'bg-slate-100', text: 'text-slate-500', icon: Upload, label: 'Not uploaded' },
    pending_verification: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending R&D verification' },
    verified: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: ShieldCheck, label: 'Verified by R&D' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export default function ProjectDocumentsSection({
  fundedProjectId,
  moaFileUrl,
  agencyCertFileUrl,
  workPlanFileUrl,
  moaStatus,
  moaReviewNote,
  moaVerifiedAt,
  agencyCertStatus,
  agencyCertReviewNote,
  agencyCertVerifiedAt,
  onDocumentChanged,
}: ProjectDocumentsSectionProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = {
    moa: useRef<HTMLInputElement>(null),
    agency_certification: useRef<HTMLInputElement>(null),
  };

  const urls: Record<DocKey, string | null> = {
    moa: moaFileUrl,
    agency_certification: agencyCertFileUrl,
  };
  const statuses: Record<DocKey, ComplianceDocStatus> = {
    moa: moaStatus,
    agency_certification: agencyCertStatus,
  };
  const reviewNotes: Record<DocKey, string | null> = {
    moa: moaReviewNote,
    agency_certification: agencyCertReviewNote,
  };
  const verifiedAts: Record<DocKey, string | null> = {
    moa: moaVerifiedAt,
    agency_certification: agencyCertVerifiedAt,
  };

  const handleUpload = async (type: DocKey, file: File) => {
    const error = validateReportFile(file);
    if (error) {
      Swal.fire({ icon: 'error', title: 'Invalid File', text: error });
      return;
    }

    setUploading(type);
    try {
      await uploadProjectDocument(fundedProjectId, type, file);
      Swal.fire({
        icon: 'success',
        title: 'Uploaded',
        text: 'Document uploaded. R&D will verify it before fund requests can proceed.',
        timer: 2500,
        showConfirmButton: false,
      });
      onDocumentChanged?.();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: err?.response?.data?.message || err?.message || 'Failed to upload document.',
      });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-slate-500" />
        Project Documents
        <span className="ml-auto text-[10px] font-medium text-slate-500 normal-case">
          R&D verifies each upload before fund requests unlock.
        </span>
      </h3>

      <div className="space-y-3">
        {DOCUMENTS.map((doc) => {
          const url = urls[doc.key];
          const status = statuses[doc.key];
          const reviewNote = reviewNotes[doc.key];
          const verifiedAt = verifiedAts[doc.key];
          const isUploading = uploading === doc.key;

          // State-machine: re-upload is only allowed from 'not_uploaded' or 'rejected'.
          // Pending = wait for R&D review. Verified = locked (ask admin to reset).
          const canUpload = status === 'not_uploaded' || status === 'rejected';
          const uploadCta = status === 'rejected' ? 'Re-upload' : 'Upload';
          const isVerified = status === 'verified';

          return (
            <div
              key={doc.key}
              className={`p-3 rounded-lg border ${
                status === 'verified' ? 'bg-emerald-50/50 border-emerald-200' :
                status === 'rejected' ? 'bg-red-50 border-red-200' :
                status === 'pending_verification' ? 'bg-amber-50 border-amber-200' :
                'bg-slate-50 border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-700">{doc.label}</span>
                    <span className="text-[9px] font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{doc.formLabel}</span>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{doc.description}</p>
                  {isVerified && verifiedAt && (
                    <p className="text-[10px] text-emerald-700 font-medium mt-1">
                      Verified on {formatDate(verifiedAt)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {url && (() => {
                    const meta = getFileActionMeta(url);
                    const ActionIcon = meta.Icon;
                    return (
                      <button
                        onClick={() => openSignedUrl(url)}
                        title={meta.title}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <ActionIcon className="w-3 h-3" />
                        {meta.label}
                      </button>
                    );
                  })()}
                  {canUpload && (
                    <button
                      onClick={() => fileInputRefs[doc.key].current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#C8102E] hover:bg-[#a00c24] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploadCta}
                    </button>
                  )}
                  {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
              </div>

              {status === 'rejected' && reviewNote && (
                <div className="mt-3 p-2.5 bg-white border border-red-200 rounded-md">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-1">
                    R&D's reason for rejection
                  </p>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{reviewNote}</p>
                  <p className="text-[10px] text-slate-500 mt-2 italic">Re-upload the corrected document to resubmit for R&D review.</p>
                </div>
              )}

              {status === 'pending_verification' && (
                <p className="text-[10px] text-amber-700 mt-2 italic">
                  Waiting for R&D to verify this upload. You can't re-upload until they finish reviewing.
                </p>
              )}

              <input
                ref={fileInputRefs[doc.key]}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(doc.key, file);
                  e.target.value = '';
                }}
              />
            </div>
          );
        })}

        {/* Read-only reference: Work & Financial Plan carried over from the proposal.
            Replacement happens through revision, not here. */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Work & Financial Plan</span>
              <span className="text-[9px] font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">DOST Form 3</span>
              <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Reference</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Latest submitted workplan from the proposal stage</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            {workPlanFileUrl ? (() => {
              const meta = getFileActionMeta(workPlanFileUrl);
              const ActionIcon = meta.Icon;
              return (
                <button
                  onClick={() => openSignedUrl(workPlanFileUrl)}
                  title={meta.title}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <ActionIcon className="w-3 h-3" />
                  {meta.label}
                </button>
              );
            })() : (
              <span className="text-[10px] font-medium text-slate-400 italic">Not uploaded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
