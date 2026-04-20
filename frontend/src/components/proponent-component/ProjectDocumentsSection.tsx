import { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { uploadProjectDocument, validateReportFile } from '../../services/ProjectMonitoringApi';
import { openSignedUrl } from '../../utils/signed-url';

interface ProjectDocumentsSectionProps {
  fundedProjectId: number;
  moaFileUrl: string | null;
  agencyCertFileUrl: string | null;
  workPlanFileUrl: string | null;
}

const DOCUMENTS = [
  {
    key: 'moa' as const,
    label: 'Memorandum of Agreement',
    formLabel: 'DOST Form 5',
    description: 'Agreement between DOST and implementing agency',
  },
  {
    key: 'agency_certification' as const,
    label: 'Certification of Agency Funding',
    formLabel: 'DOST Form 4',
    description: 'Agency certification of matching/counterpart funds',
  },
];

export default function ProjectDocumentsSection({
  fundedProjectId,
  moaFileUrl,
  agencyCertFileUrl,
  workPlanFileUrl,
}: ProjectDocumentsSectionProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [localUrls, setLocalUrls] = useState<Record<string, string | null>>({
    moa: moaFileUrl,
    agency_certification: agencyCertFileUrl,
  });
  const fileInputRefs = {
    moa: useRef<HTMLInputElement>(null),
    agency_certification: useRef<HTMLInputElement>(null),
  };

  const handleUpload = async (type: 'moa' | 'agency_certification', file: File) => {
    const error = validateReportFile(file);
    if (error) {
      Swal.fire({ icon: 'error', title: 'Invalid File', text: error });
      return;
    }

    setUploading(type);
    try {
      const result = await uploadProjectDocument(fundedProjectId, type, file);
      setLocalUrls(prev => ({ ...prev, [type]: result.file_url }));
      Swal.fire({ icon: 'success', title: 'Uploaded', text: 'Document uploaded successfully.', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.message || 'Failed to upload document.' });
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-slate-500" />
        Project Documents
      </h3>

      <div className="space-y-3">
        {DOCUMENTS.map((doc) => {
          const url = localUrls[doc.key];
          const isUploading = uploading === doc.key;

          return (
            <div key={doc.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">{doc.label}</span>
                  <span className="text-[9px] font-medium text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">{doc.formLabel}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{doc.description}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                {url ? (
                  <>
                    <button
                      onClick={() => openSignedUrl(url)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => fileInputRefs[doc.key].current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Replace
                    </button>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRefs[doc.key].current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#C8102E] hover:bg-[#a00c24] rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload
                  </button>
                )}
              </div>

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
            {workPlanFileUrl ? (
              <button
                onClick={() => openSignedUrl(workPlanFileUrl)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View
              </button>
            ) : (
              <span className="text-[10px] font-medium text-slate-400 italic">Not uploaded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
